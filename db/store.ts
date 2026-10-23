import { and, asc, desc, eq, sql } from "drizzle-orm";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { sanitizeRichText } from "@/lib/sanitize-rich-text";
import { defaultSiteContent, mergeSiteContent } from "@/lib/site-content";
import type { Product } from "@/catalog/products";
import { categories as fallbackCategories, products as fallbackProducts } from "@/catalog/products";
import { visibleCategories, type ShopCategory } from "@/lib/categories";
import { storeCategories, storeMedia, storeProductMedia, storeProducts, storeReviews, storeShopSettings, storeUsers } from "./store-schema";

export type ReviewSummary = { count: number; average: number };
export type ProductReview = { id: number; rating: number; title: string; content: string; customerName: string | null; shopReply: string | null };

export const defaultShopSettings = {
  id: 1, freeShippingThreshold: 1000000, standardShippingFee: 30000,
  siteContent: defaultSiteContent,
  bankName: "", bankAccountName: "", bankAccountNumber: "", vietQrUrl: "", shopEmail: "",
  aboutContent: "THUYNGA Shop — hàng nhập khẩu chính hãng: thực phẩm chức năng, thực phẩm, trái cây, mỹ phẩm và chăm sóc cá nhân.",
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

export async function getStoreCatalog(): Promise<{ products: Product[]; categories: string[]; categoryTree: ShopCategory[] }> {
  if (!process.env.DATABASE_URL) {
    return { products: fallbackProducts, categories: ["Tất cả", ...fallbackCategories.filter(({ parentId }) => !parentId).map(({ name }) => name)], categoryTree: fallbackCategories };
  }

  const { db, close } = openStoreDb();

  try {
    const [productRows, categoryRows, mediaRows] = await Promise.all([
      db.select({
        id: storeProducts.id,
        name: storeProducts.name,
        slug: storeProducts.slug,
        brand: storeProducts.brand,
        origin: storeProducts.origin,
        specification: storeProducts.specification,
        expiryDate: storeProducts.expiryDate,
        price: storeProducts.price,
        oldPrice: storeProducts.oldPrice,
        image: storeProducts.image,
        extraImages: storeProducts.extraImages,
        shortDescription: storeProducts.shortDescription,
        description: storeProducts.description,
        variant: storeProducts.variant,
        inStock: storeProducts.inStock,
        seoTitle: storeProducts.seoTitle,
        seoDescription: storeProducts.seoDescription,
        badge: storeProducts.badge,
        category: storeCategories.name,
        categoryId: storeProducts.categoryId,
      }).from(storeProducts).innerJoin(storeCategories, eq(storeProducts.categoryId, storeCategories.id)).where(eq(storeProducts.published, true)).orderBy(asc(storeProducts.id)),
      db.select().from(storeCategories).orderBy(asc(storeCategories.sortOrder), asc(storeCategories.id)),
      db.select({ productId: storeProductMedia.productId, url: storeMedia.url, sortOrder: storeProductMedia.sortOrder }).from(storeProductMedia).innerJoin(storeMedia, eq(storeProductMedia.mediaId, storeMedia.id)).orderBy(asc(storeProductMedia.sortOrder)),
    ]);

    const mediaImages = await db.select({ id: storeMedia.id, url: storeMedia.url }).from(storeMedia);
    const mediaById = new Map(mediaImages.map((item) => [item.id, item.url]));
    const tree = categoryRows.map((item) => ({ ...item, image: item.imageMediaId ? mediaById.get(item.imageMediaId) ?? "" : "" }));
    const visible = visibleCategories(tree);
    const ids = new Set(visible.map((item) => item.id));
    return {
      products: productRows.filter((product) => product.categoryId && ids.has(product.categoryId)).map((product) => { const images = mediaRows.filter((item) => item.productId === product.id).map((item) => item.url); return { ...product, description: sanitizeRichText(product.description), image: images[0] ?? product.image, extraImages: images.length ? images.slice(1) : product.extraImages, badge: product.badge ?? undefined }; }),
      categories: ["Tất cả", ...visible.filter(({ parentId }) => !parentId).map(({ name }) => name)],
      categoryTree: tree,
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

export async function getSiteContent() {
  const settings = await getShopSettings();
  const site = mergeSiteContent(settings.siteContent);
  if (!Object.hasOwn((settings.siteContent as Partial<typeof defaultSiteContent>)?.footer ?? {}, "contactContent") && settings.contactContent !== defaultShopSettings.contactContent) return { ...site, footer: { ...site.footer, contactContent: settings.contactContent } };
  return site;
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
    return await db.select({ id: storeReviews.id, rating: storeReviews.rating, title: storeReviews.title, content: storeReviews.content, customerName: storeUsers.name, shopReply: storeReviews.shopReply })
      .from(storeReviews).innerJoin(storeUsers, eq(storeReviews.userId, storeUsers.id))
      .where(and(eq(storeReviews.productId, productId), eq(storeReviews.status, "APPROVED"))).orderBy(desc(storeReviews.createdAt));
  } finally { await close(); }
}
