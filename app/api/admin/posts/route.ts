import { desc } from "drizzle-orm";
import { z } from "zod";
import { sanitizeRichText } from "@/lib/sanitize-rich-text";
import { hasAdminSession } from "@/app/admin-auth";
import { openStoreDb } from "@/db/store";
import { storePosts } from "@/db/store-schema";

export const postSchema = z.object({ title: z.string().trim().min(3).max(250), slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(250), image: z.union([z.literal(""), z.string().url().max(2000), z.string().regex(/^\/media-file\/[0-9a-f-]{36}\.(?:jpg|png|webp|avif)$/)]), content: z.string().trim().min(10).max(100000).transform(sanitizeRichText), published: z.boolean() });

export async function GET() { if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 }); const { db, close } = openStoreDb(); try { const posts = await db.select().from(storePosts).orderBy(desc(storePosts.createdAt)); return Response.json({ posts: posts.map((post) => ({ ...post, content: sanitizeRichText(post.content) })) }); } finally { await close(); } }
export async function POST(request: Request) { if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 }); const parsed = postSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Bài viết không hợp lệ" }, { status: 400 }); const { db, close } = openStoreDb(); try { const [post] = await db.insert(storePosts).values(parsed.data).returning(); return Response.json({ post }, { status: 201 }); } catch (error) { if ((error as { code?: string }).code === "23505") return Response.json({ error: "Slug đã tồn tại" }, { status: 409 }); throw error; } finally { await close(); } }
