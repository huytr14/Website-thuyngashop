import { eq } from "drizzle-orm";
import { z } from "zod";
import { hasAdminSession } from "@/app/admin-auth";
import { productInputSchema } from "@/app/admin-products";
import { openStoreDb } from "@/db/store";
import { storeCategories, storeProducts } from "@/db/store-schema";

const idSchema = z.coerce.number().int().positive();

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const id = idSchema.safeParse((await params).id);
  const product = productInputSchema.safeParse(await request.json().catch(() => null));
  if (!id.success || !product.success) return Response.json({ error: "Dữ liệu sản phẩm không hợp lệ" }, { status: 400 });
  const { db, close } = openStoreDb();
  try {
    if (!(await db.select({ id: storeCategories.id }).from(storeCategories).where(eq(storeCategories.id, product.data.categoryId)).limit(1)).length) {
      return Response.json({ error: "Danh mục không tồn tại" }, { status: 400 });
    }
    const [updated] = await db.update(storeProducts).set(product.data).where(eq(storeProducts.id, id.data)).returning();
    if (!updated) return Response.json({ error: "Không tìm thấy sản phẩm" }, { status: 404 });
    return Response.json({ product: updated });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") return Response.json({ error: "Slug sản phẩm đã tồn tại" }, { status: 409 });
    throw error;
  } finally { await close(); }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const id = idSchema.safeParse((await params).id);
  if (!id.success) return Response.json({ error: "ID không hợp lệ" }, { status: 400 });
  const { db, close } = openStoreDb();
  try {
    const [deleted] = await db.delete(storeProducts).where(eq(storeProducts.id, id.data)).returning({ id: storeProducts.id });
    if (!deleted) return Response.json({ error: "Không tìm thấy sản phẩm" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    if ((error as { code?: string }).code === "23503") return Response.json({ error: "Sản phẩm đã được dùng trong đơn hàng" }, { status: 409 });
    throw error;
  } finally { await close(); }
}
