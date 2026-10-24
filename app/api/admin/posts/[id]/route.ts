import { eq } from "drizzle-orm";
import { z } from "zod";
import { hasAdminSession } from "@/app/admin-auth";
import { postSchema } from "@/app/api/admin/posts/route";
import { openStoreDb } from "@/db/store";
import { storePosts } from "@/db/store-schema";
import { fieldIssue, invalidFields } from "@/lib/admin-validation";

const idSchema = z.coerce.number().int().positive();
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 }); const id = idSchema.safeParse((await params).id); const input = postSchema.safeParse(await request.json().catch(() => null)); if (!id.success) return Response.json({ error: "ID không hợp lệ" }, { status: 400 }); if (!input.success) return invalidFields(input.error); const { db, close } = openStoreDb(); try { const [post] = await db.update(storePosts).set({ ...input.data, updatedAt: new Date() }).where(eq(storePosts.id, id.data)).returning(); return post ? Response.json({ post }) : Response.json({ error: "Không tìm thấy bài viết" }, { status: 404 }); } catch (error) { if ((error as { code?: string }).code === "23505") return fieldIssue("slug", "Slug đã tồn tại", 409); throw error; } finally { await close(); } }
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) { if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 }); const id = idSchema.safeParse((await params).id); if (!id.success) return Response.json({ error: "ID không hợp lệ" }, { status: 400 }); const { db, close } = openStoreDb(); try { await db.delete(storePosts).where(eq(storePosts.id, id.data)); return Response.json({ ok: true }); } finally { await close(); } }
