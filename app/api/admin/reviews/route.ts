import { desc, eq } from "drizzle-orm";
import { hasAdminSession } from "@/app/admin-auth";
import { openStoreDb } from "@/db/store";
import { storeProducts, storeReviews, storeUsers } from "@/db/store-schema";

export async function GET() { if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 }); const { db, close } = openStoreDb(); try { const reviews = await db.select({ id: storeReviews.id, rating: storeReviews.rating, title: storeReviews.title, content: storeReviews.content, status: storeReviews.status, createdAt: storeReviews.createdAt, customerName: storeUsers.name, productName: storeProducts.name }).from(storeReviews).innerJoin(storeUsers, eq(storeReviews.userId, storeUsers.id)).innerJoin(storeProducts, eq(storeReviews.productId, storeProducts.id)).orderBy(desc(storeReviews.createdAt)); return Response.json({ reviews }); } finally { await close(); } }
