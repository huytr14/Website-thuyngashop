import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getCustomer } from "@/app/customer-session";
import { openStoreDb } from "@/db/store";
import { storeOrderItems, storeOrders, storeReviews, storeUsers } from "@/db/store-schema";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = z.coerce.number().int().positive().safeParse((await params).id);
  if (!id.success) return Response.json({ error: "ID không hợp lệ" }, { status: 400 });
  const user = await getCustomer(request);
  const { db, close } = openStoreDb();
  try {
    const reviews = await db.select({ id: storeReviews.id, rating: storeReviews.rating, title: storeReviews.title, content: storeReviews.content, createdAt: storeReviews.createdAt, customerName: storeUsers.name }).from(storeReviews).innerJoin(storeUsers, eq(storeReviews.userId, storeUsers.id)).where(and(eq(storeReviews.productId, id.data), eq(storeReviews.status, "APPROVED"))).orderBy(desc(storeReviews.createdAt));
    if (!user) return Response.json({ reviews });
    const [bought, reviewed] = await Promise.all([
      db.select({ orderId: storeOrders.id }).from(storeOrders).innerJoin(storeOrderItems, eq(storeOrderItems.orderId, storeOrders.id)).where(and(eq(storeOrders.customerId, user.id), eq(storeOrders.status, "HOAN_THANH"), eq(storeOrderItems.productId, id.data))),
      db.select({ orderId: storeReviews.orderId }).from(storeReviews).where(and(eq(storeReviews.userId, user.id), eq(storeReviews.productId, id.data))),
    ]);
    return Response.json({ reviews, reviewOrderId: bought.find((item) => !reviewed.some((review) => review.orderId === item.orderId))?.orderId ?? null });
  } finally { await close(); }
}
