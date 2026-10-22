import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { openStoreDb } from "@/db/store";
import { storeReviews, storeUsers } from "@/db/store-schema";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) { const id = z.coerce.number().int().positive().safeParse((await params).id); if (!id.success) return Response.json({ error: "ID không hợp lệ" }, { status: 400 }); const { db, close } = openStoreDb(); try { const reviews = await db.select({ id: storeReviews.id, rating: storeReviews.rating, title: storeReviews.title, content: storeReviews.content, createdAt: storeReviews.createdAt, customerName: storeUsers.name }).from(storeReviews).innerJoin(storeUsers, eq(storeReviews.userId, storeUsers.id)).where(and(eq(storeReviews.productId, id.data), eq(storeReviews.status, "APPROVED"))).orderBy(desc(storeReviews.createdAt)); return Response.json({ reviews }); } finally { await close(); } }
