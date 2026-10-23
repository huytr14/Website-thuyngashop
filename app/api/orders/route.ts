import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { checkoutSchema } from "@/app/checkout-schema";
import { checkoutRateLimited, requestClient } from "@/app/checkout-rate-limit";
import { sendOrderEmails } from "@/app/order-email";
import { defaultShopSettings, openStoreDb } from "@/db/store";
import { storeOrderItems, storeOrders, storeProducts, storeShopSettings, storeVouchers } from "@/db/store-schema";
import { orderCode, shippingFee, voucherDiscount, voucherError, type VoucherRule } from "@/lib/commerce";
import { getCustomer } from "@/app/customer-session";
import { canBuy, pricedLine } from "@/lib/product-pricing";

const idempotencySchema = z.string().uuid();

export async function POST(request: Request) {
  if (checkoutRateLimited(`order:${requestClient(request)}`)) return Response.json({ error: "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau." }, { status: 429 });
  const key = idempotencySchema.safeParse(request.headers.get("idempotency-key"));
  const input = checkoutSchema.safeParse(await request.json().catch(() => null));
  if (!key.success || !input.success) return Response.json({ error: input.success ? "Thiếu mã chống trùng đơn" : input.error.issues[0]?.message ?? "Dữ liệu đặt hàng không hợp lệ" }, { status: 400 });

  const customer = await getCustomer(request);
  const { db, close } = openStoreDb();
  try {
    const existing = (await db.select({ code: storeOrders.code, total: storeOrders.total, paymentMethod: storeOrders.paymentMethod }).from(storeOrders).where(eq(storeOrders.idempotencyKey, key.data)).limit(1))[0];
    if (existing) return Response.json({ order: existing, duplicate: true });

    let result: { order: typeof storeOrders.$inferSelect; shopEmail: string; bankName: string; bankAccountName: string; bankAccountNumber: string; items: { productName: string; variantName: string | null; price: number; quantity: number }[] } | undefined;
    for (let attempt = 0; attempt < 5 && !result; attempt++) try {
      result = await db.transaction(async (tx) => {
      const products = await tx.select().from(storeProducts).where(inArray(storeProducts.id, input.data.items.map(({ productId }) => productId))).orderBy(asc(storeProducts.id)).for("update");
      const settings = (await tx.select().from(storeShopSettings).where(eq(storeShopSettings.id, 1)).limit(1))[0] ?? defaultShopSettings;
      const now = new Date();
      const lines = input.data.items.map((item) => ({ item, product: products.find(({ id }) => id === item.productId) }));
      if (lines.some(({ item, product }) => !product?.published || !canBuy(product, item.variantName, item.quantity, input.data.items.filter((entry) => entry.productId === item.productId).reduce((sum, entry) => sum + entry.quantity, 0), settings, now))) throw new OrderInputError("Có sản phẩm hoặc biến thể không tồn tại, đã hết hàng");
      const subtotal = lines.reduce((sum, { item, product }) => sum + pricedLine(product!, item.variantName, settings, now)!.price * item.quantity, 0);
      const shipping = shippingFee(subtotal, settings.freeShippingThreshold, settings.standardShippingFee);
      const voucher = input.data.voucherCode ? (await tx.select().from(storeVouchers).where(eq(storeVouchers.code, input.data.voucherCode)).for("update").limit(1))[0] : undefined;
      const error = input.data.voucherCode ? voucherError(voucher as VoucherRule | undefined, subtotal) : null;
      if (error) throw new OrderInputError(error);
      if (voucher?.perCustomerLimit) {
        const [{ count }] = await tx.select({ count: sql<number>`count(*)::int` }).from(storeOrders).where(and(eq(storeOrders.voucherCode, voucher.code), eq(storeOrders.email, input.data.email)));
        if (count >= voucher.perCustomerLimit) throw new OrderInputError("Bạn đã dùng hết lượt cho mã giảm giá này");
      }
      const discount = voucherDiscount(voucher as VoucherRule | null, subtotal, shipping);
      const total = subtotal + shipping - discount;
      const [order] = await tx.insert(storeOrders).values({
        code: orderCode(), idempotencyKey: key.data, customerName: input.data.customerName, email: input.data.email,
        phone: input.data.phone, address: input.data.address, city: input.data.city, district: input.data.district,
        note: input.data.note || null, subtotal, shippingFee: shipping, discount, total,
        voucherCode: voucher?.code ?? null, paymentMethod: input.data.paymentMethod, customerId: customer?.id ?? null,
      }).returning();
      const orderItems = input.data.items.map((item) => {
        const product = products.find(({ id }) => id === item.productId)!;
        const line = pricedLine(product, item.variantName, settings, now)!;
        return { orderId: order.id, productId: product.id, productName: product.name, variantName: line.variantName, price: line.price, quantity: item.quantity, inventoryDeducted: product.trackInventory, flashStockDeducted: line.flashApplied && product.flashStock !== null };
      });
      await tx.insert(storeOrderItems).values(orderItems);
      for (const product of products) {
        const ordered = input.data.items.filter((item) => item.productId === product.id);
        const quantity = ordered.reduce((sum, item) => sum + item.quantity, 0);
        const variantRows = product.variantRows.map((row) => ({ ...row, quantity: row.quantity - ordered.filter((item) => item.variantName === row.name).reduce((sum, item) => sum + item.quantity, 0) }));
        const inventoryQuantity = product.trackInventory ? product.inventoryQuantity - quantity : product.inventoryQuantity;
        const flashQuantity = ordered.filter((item) => pricedLine(product, item.variantName, settings, now)!.flashApplied).reduce((sum, item) => sum + item.quantity, 0);
        await tx.update(storeProducts).set({ inventoryQuantity, variantRows: product.trackInventory ? variantRows : product.variantRows, flashStock: product.flashStock === null ? null : product.flashStock - flashQuantity, inStock: product.trackInventory ? inventoryQuantity > 0 && (!variantRows.length || variantRows.some((row) => row.quantity > 0)) : product.inStock }).where(eq(storeProducts.id, product.id));
      }
      if (voucher) await tx.update(storeVouchers).set({ usedCount: sql`${storeVouchers.usedCount} + 1` }).where(eq(storeVouchers.id, voucher.id));
        return { order, shopEmail: settings.shopEmail, bankName: settings.bankName, bankAccountName: settings.bankAccountName, bankAccountNumber: settings.bankAccountNumber, items: orderItems };
      });
    } catch (error) {
      if ((error as { constraint_name?: string }).constraint_name !== "orders_code_unique" || attempt === 4) throw error;
    }
    if (!result) throw new Error("Không thể tạo mã đơn hàng");
    revalidatePath("/"); revalidatePath("/san-pham/[slug]", "page");

    try {
      await sendOrderEmails({ code: result.order.code, customerName: result.order.customerName, customerEmail: result.order.email, total: result.order.total, shopEmail: result.shopEmail, paymentMethod: result.order.paymentMethod, bankName: result.bankName, bankAccountName: result.bankAccountName, bankAccountNumber: result.bankAccountNumber, items: result.items });
    } catch { console.error(`[email] Failed to send notifications for order ${result.order.code}`); }
    return Response.json({ order: { code: result.order.code, total: result.order.total, paymentMethod: result.order.paymentMethod } }, { status: 201 });
  } catch (error) {
    if (error instanceof OrderInputError) return Response.json({ error: error.message }, { status: 400 });
    if ((error as { code?: string }).code === "23505") {
      const existing = (await db.select({ code: storeOrders.code, total: storeOrders.total, paymentMethod: storeOrders.paymentMethod }).from(storeOrders).where(eq(storeOrders.idempotencyKey, key.data)).limit(1))[0];
      if (existing) return Response.json({ order: existing, duplicate: true });
    }
    throw error;
  } finally { await close(); }
}

class OrderInputError extends Error {}
