import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hasAdminSession } from "@/app/admin-auth";
import { productInputSchema } from "@/app/admin-products";
import { saveProduct } from "@/db/save-product";
import { openStoreDb } from "@/db/store";
import { storeProducts } from "@/db/store-schema";

const idSchema = z.coerce.number().int().positive();

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const id = idSchema.safeParse((await params).id);
  const product = productInputSchema.safeParse(await request.json().catch(() => null));
  if (!id.success || !product.success) return Response.json({ error: "Dữ liệu sản phẩm không hợp lệ" }, { status: 400 });
  try {
    const updated = await saveProduct(product.data, id.data);
    if (!updated) return Response.json({ error: "Không tìm thấy sản phẩm" }, { status: 404 });
    revalidatePath("/"); revalidatePath("/san-pham/[slug]", "page"); revalidatePath("/danh-muc/[slug]", "page");
    return Response.json({ product: updated });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") return Response.json({ error: "Slug sản phẩm đã tồn tại" }, { status: 409 });
    if (error instanceof Error && ["Danh mục không tồn tại", "Ảnh trong kho không hợp lệ", "Không thể tạo slug từ tên sản phẩm", "Không tìm thấy sản phẩm"].includes(error.message)) return Response.json({ error: error.message }, { status: error.message === "Không tìm thấy sản phẩm" ? 404 : 400 });
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const id = idSchema.safeParse((await params).id);
  if (!id.success) return Response.json({ error: "ID không hợp lệ" }, { status: 400 });
  const { db, close } = openStoreDb();
  try {
    const [deleted] = await db.delete(storeProducts).where(eq(storeProducts.id, id.data)).returning({ id: storeProducts.id });
    if (!deleted) return Response.json({ error: "Không tìm thấy sản phẩm" }, { status: 404 });
    revalidatePath("/"); revalidatePath("/san-pham/[slug]", "page"); revalidatePath("/danh-muc/[slug]", "page");
    return Response.json({ ok: true });
  } catch (error) {
    if ((error as { code?: string }).code === "23503") return Response.json({ error: "Sản phẩm đã được dùng trong đơn hàng" }, { status: 409 });
    throw error;
  } finally { await close(); }
}
