import { eq } from "drizzle-orm";
import { z } from "zod";
import { hasAdminSession } from "@/app/admin-auth";
import { openStoreDb } from "@/db/store";
import { storeMedia } from "@/db/store-schema";
import { mediaStorage } from "@/lib/media-storage";
import { mediaUsage } from "../route";

const idSchema = z.coerce.number().int().positive();

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const id = idSchema.safeParse((await params).id);
  const body = z.object({ alt: z.string().trim().max(300) }).safeParse(await request.json().catch(() => null));
  if (!id.success || !body.success) return Response.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  const { db, close } = openStoreDb();
  try { const [media] = await db.update(storeMedia).set(body.data).where(eq(storeMedia.id, id.data)).returning(); return media ? Response.json({ media }) : Response.json({ error: "Không tìm thấy ảnh" }, { status: 404 }); }
  finally { await close(); }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const id = idSchema.safeParse((await params).id);
  if (!id.success) return Response.json({ error: "ID không hợp lệ" }, { status: 400 });
  const { db, close } = openStoreDb();
  try {
    const [media] = await db.select().from(storeMedia).where(eq(storeMedia.id, id.data)).limit(1);
    if (!media) return Response.json({ error: "Không tìm thấy ảnh" }, { status: 404 });
    const usage = await mediaUsage(db, media.id, media.url);
    if (usage.length) return Response.json({ error: "Ảnh đang được dùng", usage }, { status: 409 });
    try { await db.delete(storeMedia).where(eq(storeMedia.id, media.id)); }
    catch (error) { if ((error as { code?: string }).code === "23503") return Response.json({ error: "Ảnh đang được dùng" }, { status: 409 }); throw error; }
    if (media.storageKey) await mediaStorage.delete(media.storageKey);
    return Response.json({ ok: true });
  } finally { await close(); }
}
