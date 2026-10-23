import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hasAdminSession } from "@/app/admin-auth";
import { openStoreDb } from "@/db/store";
import { storeProducts } from "@/db/store-schema";

const rowSchema = z.object({ id: z.number().int().positive(), price: z.number().int().nonnegative().optional(), oldPrice: z.number().int().nonnegative().optional(), inventoryQuantity: z.number().int().nonnegative().optional(), published: z.boolean().optional() });
const inputSchema = z.object({ updates: z.array(rowSchema).min(1).max(100) });

export async function POST(request: Request) {
  if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Dữ liệu cập nhật không hợp lệ" }, { status: 400 });
  const { db, close } = openStoreDb();
  try {
    const results = [];
    for (const update of parsed.data.updates) {
      const current = (await db.select().from(storeProducts).where(eq(storeProducts.id, update.id)).limit(1))[0];
      if (!current) { results.push({ id: update.id, error: "Không tìm thấy sản phẩm" }); continue; }
      if (update.inventoryQuantity !== undefined && current.variantRows.length) { results.push({ id: update.id, error: "Sửa tồn từng biến thể trong trình sửa sản phẩm" }); continue; }
      const price = update.price ?? current.price, oldPrice = update.oldPrice ?? current.oldPrice, published = update.published ?? current.published;
      if (oldPrice && oldPrice < price) { results.push({ id: update.id, error: "Giá gốc phải lớn hơn hoặc bằng giá bán" }); continue; }
      if (published && (!price || !current.categoryId || !current.image)) { results.push({ id: update.id, error: "Đang bán cần giá, ảnh và danh mục" }); continue; }
      const { id: _id, ...fields } = update;
      const [product] = await db.update(storeProducts).set({ ...fields, ...(current.trackInventory && update.inventoryQuantity !== undefined ? { inStock: update.inventoryQuantity > 0 } : {}) }).where(eq(storeProducts.id, update.id)).returning();
      results.push({ id: update.id, product });
    }
    if (results.some((item) => "product" in item)) { revalidatePath("/"); revalidatePath("/san-pham/[slug]", "page"); revalidatePath("/danh-muc/[slug]", "page"); }
    return Response.json({ results });
  } finally { await close(); }
}
