import { eq, inArray } from "drizzle-orm";
import type { ProductInput } from "@/app/admin-products";
import { slugify } from "@/app/admin-products";
import { openStoreDb } from "./store";
import { storeCategories, storeMedia, storeProductMedia, storeProducts } from "./store-schema";

export async function saveProduct(input: ProductInput, id?: number) {
  const { db, close } = openStoreDb();
  try {
    return await db.transaction(async (tx) => {
      const { mediaIds, slugCustom, ...values } = input;
      if (values.categoryId && !(await tx.select({ id: storeCategories.id }).from(storeCategories).where(eq(storeCategories.id, values.categoryId)).limit(1)).length) throw new Error("Danh mục không tồn tại");
      const media = mediaIds.length ? await tx.select().from(storeMedia).where(inArray(storeMedia.id, mediaIds)) : [];
      if (media.length !== new Set(mediaIds).size || mediaIds.length !== new Set(mediaIds).size) throw new Error("Ảnh trong kho không hợp lệ");
      const byId = new Map(media.map((item) => [item.id, item]));
      const image = mediaIds.length ? byId.get(mediaIds[0])!.url : values.image;
      const extraImages = mediaIds.length ? mediaIds.slice(1).map((mediaId) => byId.get(mediaId)!.url) : values.extraImages;
      const baseSlug = values.slug || slugify(values.name) || `san-pham-${crypto.randomUUID().slice(0, 8)}`;
      let slug = baseSlug;
      if (!id && !slugCustom) for (let suffix = 2; (await tx.select({ id: storeProducts.id }).from(storeProducts).where(eq(storeProducts.slug, slug)).limit(1)).length; suffix++) slug = `${baseSlug}-${suffix}`;
      const row = { ...values, slug, image, extraImages, inStock: values.trackInventory ? values.variantRows.length ? values.variantRows.some((variant) => variant.quantity > 0) : values.inventoryQuantity > 0 : values.inStock };
      const [product] = id ? await tx.update(storeProducts).set(row).where(eq(storeProducts.id, id)).returning() : await tx.insert(storeProducts).values(row).returning();
      if (!product) throw new Error("Không tìm thấy sản phẩm");
      await tx.delete(storeProductMedia).where(eq(storeProductMedia.productId, product.id));
      if (mediaIds.length) await tx.insert(storeProductMedia).values(mediaIds.map((mediaId, sortOrder) => ({ productId: product.id, mediaId, sortOrder })));
      return product;
    });
  } finally { await close(); }
}
