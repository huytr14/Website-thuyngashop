import { eq } from "drizzle-orm";
import { hasAdminSession } from "@/app/admin-auth";
import { parseProductCsv } from "@/app/admin-products";
import { openStoreDb } from "@/db/store";
import { storeCategories, storeProducts } from "@/db/store-schema";
import { categoryPath } from "@/lib/categories";

export async function POST(request: Request) {
  if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const file = (await request.formData().catch(() => new FormData())).get("file");
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".csv") || !["text/csv", "application/vnd.ms-excel", "application/octet-stream"].includes(file.type)) return Response.json({ errors: ["Vui lòng chọn file CSV hợp lệ"] }, { status: 400 });
  if (file.size > 2 * 1024 * 1024) return Response.json({ errors: ["File CSV không được vượt quá 2 MB"] }, { status: 400 });

  const parsed = parseProductCsv(await file.text());
  if (parsed.errors.length) return Response.json({ errors: parsed.errors }, { status: 400 });

  const { db, close } = openStoreDb();
  try {
    const [categories, existingProducts] = await Promise.all([
      db.select().from(storeCategories),
      db.select({ id: storeProducts.id, name: storeProducts.name, slug: storeProducts.slug, badge: storeProducts.badge }).from(storeProducts),
    ]);
    const categoryIds = new Map(categories.map((category) => [categoryPath(category, categories).toLocaleLowerCase("vi-VN"), category.id]));
    const byName = new Map(existingProducts.map((product) => [product.name.toLocaleLowerCase("vi-VN"), product]));
    const bySlug = new Map(existingProducts.map((product) => [product.slug, product]));
    const errors: string[] = [];

    for (const product of parsed.products) {
      const categoryId = categoryIds.get(product.categoryName.toLocaleLowerCase("vi-VN"));
      const existing = byName.get(product.name.toLocaleLowerCase("vi-VN"));
      if (!categoryId) errors.push(`Dòng ${product.line}: danh mục "${product.categoryName}" không tồn tại`);
      if (!existing && bySlug.has(product.slug)) errors.push(`Dòng ${product.line}: slug "${product.slug}" đã thuộc sản phẩm khác`);
    }
    if (errors.length) return Response.json({ errors }, { status: 400 });

    let created = 0;
    let updated = 0;
    await db.transaction(async (tx) => {
      for (const product of parsed.products) {
        const existing = byName.get(product.name.toLocaleLowerCase("vi-VN"));
        const categoryId = categoryIds.get(product.categoryName.toLocaleLowerCase("vi-VN"))!;
        const { categoryName: _categoryName, line: _line, mediaIds: _mediaIds, slugCustom: _slugCustom, ...values } = product;
        const row = { ...values, slug: existing?.slug ?? values.slug, badge: existing?.badge ?? null, categoryId };
        if (existing) { await tx.update(storeProducts).set(row).where(eq(storeProducts.id, existing.id)); updated++; }
        else { await tx.insert(storeProducts).values(row); created++; }
      }
    });
    return Response.json({ created, updated });
  } finally { await close(); }
}
