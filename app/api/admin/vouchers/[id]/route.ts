import { eq } from "drizzle-orm";
import { z } from "zod";
import { hasAdminSession } from "@/app/admin-auth";
import { openStoreDb } from "@/db/store";
import { storeVouchers } from "@/db/store-schema";
import { voucherSchema } from "../route";

const idSchema = z.coerce.number().int().positive();
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const id = idSchema.safeParse((await params).id);
  const parsed = voucherSchema.safeParse(await request.json().catch(() => null));
  if (!id.success || !parsed.success) return Response.json({ error: parsed.error?.issues[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 });
  const { db, close } = openStoreDb();
  try { const [voucher] = await db.update(storeVouchers).set(parsed.data).where(eq(storeVouchers.id, id.data)).returning(); return voucher ? Response.json({ voucher }) : Response.json({ error: "Không tìm thấy mã" }, { status: 404 }); }
  catch (error) { if ((error as { code?: string }).code === "23505") return Response.json({ error: "Mã giảm giá đã tồn tại" }, { status: 409 }); throw error; }
  finally { await close(); }
}
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const id = idSchema.safeParse((await params).id);
  if (!id.success) return Response.json({ error: "ID không hợp lệ" }, { status: 400 });
  const { db, close } = openStoreDb();
  try { const [voucher] = await db.delete(storeVouchers).where(eq(storeVouchers.id, id.data)).returning({ id: storeVouchers.id }); return voucher ? Response.json({ ok: true }) : Response.json({ error: "Không tìm thấy mã" }, { status: 404 }); }
  finally { await close(); }
}
