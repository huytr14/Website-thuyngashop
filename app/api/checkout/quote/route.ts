import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { cartItemsSchema } from "@/app/checkout-schema";
import { checkoutRateLimited, requestClient } from "@/app/checkout-rate-limit";
import { defaultShopSettings, openStoreDb } from "@/db/store";
import { storeProducts, storeShopSettings, storeVouchers } from "@/db/store-schema";
import { shippingFee, voucherDiscount, voucherError, type VoucherRule } from "@/lib/commerce";

const quoteSchema = z.object({ items: cartItemsSchema, voucherCode: z.string().trim().max(50).optional().default("").transform((value) => value.toUpperCase()) });

export async function POST(request: Request) {
  if (checkoutRateLimited(`quote:${requestClient(request)}`)) return Response.json({ error: "Bạn thao tác quá nhanh. Vui lòng thử lại sau." }, { status: 429 });
  const parsed = quoteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Giỏ hàng hoặc mã giảm giá không hợp lệ" }, { status: 400 });
  const { db, close } = openStoreDb();
  try {
    const products = await db.select({ id: storeProducts.id, price: storeProducts.price, inStock: storeProducts.inStock, published: storeProducts.published }).from(storeProducts).where(inArray(storeProducts.id, parsed.data.items.map(({ productId }) => productId)));
    if (products.length !== parsed.data.items.length || products.some(({ inStock, published }) => !inStock || !published)) return Response.json({ error: "Có sản phẩm không tồn tại hoặc đã hết hàng" }, { status: 400 });
    const subtotal = parsed.data.items.reduce((sum, item) => sum + products.find(({ id }) => id === item.productId)!.price * item.quantity, 0);
    const settings = (await db.select().from(storeShopSettings).where(eq(storeShopSettings.id, 1)).limit(1))[0] ?? defaultShopSettings;
    const shipping = shippingFee(subtotal, settings.freeShippingThreshold, settings.standardShippingFee);
    const voucher = parsed.data.voucherCode ? (await db.select().from(storeVouchers).where(eq(storeVouchers.code, parsed.data.voucherCode)).limit(1))[0] : undefined;
    const error = parsed.data.voucherCode ? voucherError(voucher as VoucherRule | undefined, subtotal) : null;
    if (error) return Response.json({ error }, { status: 400 });
    const discount = voucherDiscount(voucher as VoucherRule | null, subtotal, shipping);
    return Response.json({ subtotal, shipping, discount, total: subtotal + shipping - discount, voucherCode: voucher?.code ?? "" });
  } finally { await close(); }
}
