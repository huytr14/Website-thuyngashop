import { and, asc, desc, eq, sql } from "drizzle-orm";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import type { Product } from "@/catalog/products";
import { categories as fallbackCategories, products as fallbackProducts } from "@/catalog/products";
import { storeCategories, storeProducts, storeReviews, storeShopSettings, storeUsers } from "./store-schema";

export type ReviewSummary = { count: number; average: number };
export type ProductReview = { id: number; rating: number; title: string; content: string; customerName: string | null };

export const defaultShopSettings = {
  id: 1, freeShippingThreshold: 1000000, standardShippingFee: 30000,
  bankName: "", bankAccountName: "", bankAccountNumber: "", vietQrUrl: "", shopEmail: "",
  aboutContent: "THUYNGA Shop tuyển chọn những sản phẩm làm đẹp phù hợp cho nhịp sống hiện đại.",
  contactContent: "Hãy để lại lời nhắn, THUYNGA Shop sẽ phản hồi trong thời gian sớm nhất.",
  privacyPolicy: "Thông tin khách hàng chỉ được sử dụng để xử lý đơn hàng và hỗ trợ mua sắm.",
  shippingPolicy: "Đơn hàng được giao theo phương thức vận chuyển đã chọn khi thanh toán.",
  returnsPolicy: "Vui lòng liên hệ cửa hàng để được hướng dẫn đổi trả theo tình trạng sản phẩm.",
  termsPolicy: "Khách hàng chịu trách nhiệm cung cấp thông tin nhận hàng chính xác.",
};

export function openStoreDb() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  const client = new Pool({ connectionString: process.env.DATABASE_URL });
  return { db: drizzle(client), close: () => client.end() };
}

export async function getStoreCatalog(): Promise<{ products: Product[]; categories: string[] }> {
  if (!process.env.DATABASE_URL) {
    return { products: fallbackProducts, categories: ["Tất cả", ...fallbackCategories.map(({ name }) => name)] };
  }

  const { db, close } = openStoreDb();

  try {
    const [productRows, categoryRows] = await Promise.all([
      db.select({
        id: storeProducts.id,
        name: storeProducts.name,
        slug: storeProducts.slug,
        brand: storeProducts.brand,
        price: storeProducts.price,
        oldPrice: storeProducts.oldPrice,
        image: storeProducts.image,
        extraImages: storeProducts.extraImages,
        shortDescription: storeProducts.shortDescription,
        description: storeProducts.description,
        variant: storeProducts.variant,
        inStock: storeProducts.inStock,
        badge: storeProducts.badge,
        category: storeCategories.name,
      }).from(storeProducts).innerJoin(storeCategories, eq(storeProducts.categoryId, storeCategories.id)).orderBy(asc(storeProducts.id)),
      db.select({ name: storeCategories.name }).from(storeCategories).orderBy(asc(storeCategories.id)),
    ]);

    return {
      products: productRows.map((product) => ({ ...product, badge: product.badge ?? undefined })),
      categories: ["Tất cả", ...categoryRows.map(({ name }) => name)],
    };
  } finally {
    await close();
  }
}

export async function getShopSettings() {
  if (!process.env.DATABASE_URL) return defaultShopSettings;
  const { db, close } = openStoreDb();
  try {
    return (await db.select().from(storeShopSettings).where(eq(storeShopSettings.id, 1)).limit(1))[0] ?? defaultShopSettings;
  } finally { await close(); }
}

export async function getApprovedReviewSummaries(): Promise<Record<number, ReviewSummary>> {
  if (!process.env.DATABASE_URL) return {};
  const { db, close } = openStoreDb();
  try {
    const rows = await db.select({ productId: storeReviews.productId, count: sql<number>`count(*)::int`, average: sql<number>`round(avg(${storeReviews.rating})::numeric, 1)::float` })
      .from(storeReviews).where(eq(storeReviews.status, "APPROVED")).groupBy(storeReviews.productId);
    return Object.fromEntries(rows.map(({ productId, count, average }) => [productId, { count, average }]));
  } finally { await close(); }
}

export async function getApprovedProductReviews(productId: number): Promise<ProductReview[]> {
  if (!process.env.DATABASE_URL) return [];
  const { db, close } = openStoreDb();
  try {
    return await db.select({ id: storeReviews.id, rating: storeReviews.rating, title: storeReviews.title, content: storeReviews.content, customerName: storeUsers.name })
      .from(storeReviews).innerJoin(storeUsers, eq(storeReviews.userId, storeUsers.id))
      .where(and(eq(storeReviews.productId, productId), eq(storeReviews.status, "APPROVED"))).orderBy(desc(storeReviews.createdAt));
  } finally { await close(); }
}
