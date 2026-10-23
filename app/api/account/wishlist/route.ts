import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getCustomer } from "@/app/customer-session";
import { checkoutRateLimited, requestClient } from "@/app/checkout-rate-limit";
import { openStoreDb } from "@/db/store";
import { storeProducts, storeWishlistItems } from "@/db/store-schema";

const idsSchema = z.object({ productIds: z.array(z.number().int().positive()).max(100) });

export async function GET(request: Request) {
  const user = await getCustomer(request); if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { db, close } = openStoreDb();
  try { const rows = await db.select({ productId: storeWishlistItems.productId }).from(storeWishlistItems).where(eq(storeWishlistItems.userId, user.id)); return Response.json({ productIds: rows.map((row) => row.productId) }); } finally { await close(); }
}

export async function POST(request: Request) {
  if (checkoutRateLimited(`wishlist:${requestClient(request)}`)) return Response.json({ error: "Bạn thao tác quá nhanh" }, { status: 429 });
  const user = await getCustomer(request); if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = idsSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return Response.json({ error: "Sản phẩm không hợp lệ" }, { status: 400 });
  const { db, close } = openStoreDb();
  try { const products = parsed.data.productIds.length ? await db.select({ id: storeProducts.id }).from(storeProducts).where(and(inArray(storeProducts.id, parsed.data.productIds), eq(storeProducts.published, true))) : []; if (products.length !== new Set(parsed.data.productIds).size) return Response.json({ error: "Sản phẩm không hợp lệ" }, { status: 400 }); if (products.length) await db.insert(storeWishlistItems).values(products.map(({ id }) => ({ productId: id, userId: user.id }))).onConflictDoNothing(); return Response.json({ productIds: products.map(({ id }) => id) }); } finally { await close(); }
}

export async function DELETE(request: Request) {
  if (checkoutRateLimited(`wishlist:${requestClient(request)}`)) return Response.json({ error: "Bạn thao tác quá nhanh" }, { status: 429 });
  const user = await getCustomer(request); if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = z.object({ productId: z.number().int().positive() }).safeParse(await request.json().catch(() => null)); if (!parsed.success) return Response.json({ error: "Sản phẩm không hợp lệ" }, { status: 400 });
  const { db, close } = openStoreDb();
  try { await db.delete(storeWishlistItems).where(and(eq(storeWishlistItems.userId, user.id), eq(storeWishlistItems.productId, parsed.data.productId))); return Response.json({ ok: true }); } finally { await close(); }
}
