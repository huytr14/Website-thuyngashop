import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { cartItemsSchema } from "@/app/checkout-schema";
import { checkoutRateLimited, requestClient } from "@/app/checkout-rate-limit";
import { defaultShopSettings, openStoreDb } from "@/db/store";
import { storeProducts, storeShopSettings, storeVouchers } from "@/db/store-schema";
import { shippingFee, voucherDiscount, voucherError, type VoucherRule } from "@/lib/commerce";
import { canBuy, pricedLine } from "@/lib/product-pricing";

const quoteSchema = z.object({ items: cartItemsSchema, voucherCode: z.string().trim().max(50).optional().default("").transform((value) => value.toUpperCase()) });

export async function POST(request: Request) {
  if (checkoutRateLimited(`quote:${requestClient(request)}`)) return Response.json({ error: "Bạn thao tác quá nhanh. Vui lòng thử lại sau." }, { status: 429 });
  const parsed = quoteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Giỏ hàng hoặc mã giảm giá không hợp lệ" }, { status: 400 });
  const { db, close } = openStoreDb();
  try {
    const products = await db.select().from(storeProducts).where(inArray(storeProducts.id, parsed.data.items.map(({ productId }) => productId)));
    const settings = (await db.select().from(storeShopSettings).where(eq(storeShopSettings.id, 1)).limit(1))[0] ?? defaultShopSettings;
    const lines = parsed.data.items.map((item) => ({ item, product: products.find(({ id }) => id === item.productId) }));
    if (lines.some(({ item, product }) => !product?.published || !canBuy(product, item.variantName, item.quantity, parsed.data.items.filter((entry) => entry.productId === item.productId).reduce((sum, entry) => sum + entry.quantity, 0), settings))) return Response.json({ error: "Có sản phẩm hoặc biến thể không tồn tại, đã hết hàng" }, { status: 400 });
    const subtotal = lines.reduce((sum, { item, product }) => sum + pricedLine(product!, item.variantName, settings)!.price * item.quantity, 0);
    const shipping = shippingFee(subtotal, settings.freeShippingThreshold, settings.standardShippingFee);
    const voucher = parsed.data.voucherCode ? (await db.select().from(storeVouchers).where(eq(storeVouchers.code, parsed.data.voucherCode)).limit(1))[0] : undefined;
    const error = parsed.data.voucherCode ? voucherError(voucher as VoucherRule | undefined, subtotal) : null;
    if (error) return Response.json({ error }, { status: 400 });
    const discount = voucherDiscount(voucher as VoucherRule | null, subtotal, shipping);
    return Response.json({ subtotal, shipping, discount, total: subtotal + shipping - discount, voucherCode: voucher?.code ?? "" });
  } finally { await close(); }
}
