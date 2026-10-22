import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getCustomer } from "@/app/customer-session";
import { openStoreDb } from "@/db/store";
import { storeOrderItems, storeOrders, storeReviews } from "@/db/store-schema";

const reviewSchema = z.object({ orderId: z.coerce.number().int().positive(), productId: z.coerce.number().int().positive(), rating: z.coerce.number().int().min(1).max(5), title: z.string().trim().max(150).optional().default(""), content: z.string().trim().min(10).max(2000) });

export async function POST(request: Request) {
  const user = await getCustomer(request); if (!user) return Response.json({ error: "Bạn cần đăng nhập" }, { status: 401 });
  const parsed = reviewSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Đánh giá không hợp lệ" }, { status: 400 });
  const { db, close } = openStoreDb(); try {
    const purchased = (await db.select({ id: storeOrderItems.id }).from(storeOrderItems).innerJoin(storeOrders, eq(storeOrderItems.orderId, storeOrders.id)).where(and(eq(storeOrders.id, parsed.data.orderId), eq(storeOrders.customerId, user.id), eq(storeOrders.status, "HOAN_THANH"), eq(storeOrderItems.productId, parsed.data.productId))).limit(1))[0];
    if (!purchased) return Response.json({ error: "Chỉ khách đã hoàn thành đơn mua sản phẩm mới được đánh giá" }, { status: 403 });
    const [review] = await db.insert(storeReviews).values({ ...parsed.data, userId: user.id }).returning(); return Response.json({ review }, { status: 201 });
  } catch (error) { if ((error as { code?: string }).code === "23505") return Response.json({ error: "Bạn đã đánh giá sản phẩm trong đơn này" }, { status: 409 }); throw error; } finally { await close(); }
}
