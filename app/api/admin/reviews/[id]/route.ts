import { eq } from "drizzle-orm";
import { z } from "zod";
import { hasAdminSession } from "@/app/admin-auth";
import { openStoreDb } from "@/db/store";
import { storeReviews } from "@/db/store-schema";

const schema = z.object({ status: z.enum(["APPROVED", "REJECTED"]) });
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 }); const id = z.coerce.number().int().positive().safeParse((await params).id); const input = schema.safeParse(await request.json().catch(() => null)); if (!id.success || !input.success) return Response.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 }); const { db, close } = openStoreDb(); try { const [review] = await db.update(storeReviews).set(input.data).where(eq(storeReviews.id, id.data)).returning(); return review ? Response.json({ review }) : Response.json({ error: "Không tìm thấy đánh giá" }, { status: 404 }); } finally { await close(); } }
