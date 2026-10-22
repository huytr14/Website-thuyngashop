import { asc, desc, eq } from "drizzle-orm";
import { hasAdminSession } from "@/app/admin-auth";
import { defaultShopSettings, openStoreDb } from "@/db/store";
import { storeCategories, storeContactMessages, storeOrders, storeProducts, storeShopSettings } from "@/db/store-schema";

export async function GET() {
  if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { db, close } = openStoreDb();
  try {
    const [products, categories, orders, settings, messages] = await Promise.all([
      db.select({
        id: storeProducts.id, name: storeProducts.name, slug: storeProducts.slug, brand: storeProducts.brand,
        price: storeProducts.price, oldPrice: storeProducts.oldPrice, image: storeProducts.image,
        extraImages: storeProducts.extraImages, shortDescription: storeProducts.shortDescription,
        description: storeProducts.description, variant: storeProducts.variant, inStock: storeProducts.inStock,
        badge: storeProducts.badge, categoryId: storeProducts.categoryId, categoryName: storeCategories.name,
      }).from(storeProducts).innerJoin(storeCategories, eq(storeProducts.categoryId, storeCategories.id)).orderBy(asc(storeProducts.id)),
      db.select().from(storeCategories).orderBy(asc(storeCategories.id)),
      db.select().from(storeOrders).orderBy(desc(storeOrders.createdAt)),
      db.select().from(storeShopSettings).where(eq(storeShopSettings.id, 1)).limit(1),
      db.select().from(storeContactMessages).orderBy(desc(storeContactMessages.createdAt)).limit(100),
    ]);
    return Response.json({ products, categories, orders, settings: settings[0] ?? defaultShopSettings, messages });
  } finally { await close(); }
}
