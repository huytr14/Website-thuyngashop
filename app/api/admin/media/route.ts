import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { hasAdminSession } from "@/app/admin-auth";
import { openStoreDb } from "@/db/store";
import { storeMedia, storePosts, storeProductMedia, storeProducts, storeShopSettings } from "@/db/store-schema";
import { mergeSiteContent } from "@/lib/site-content";

const externalSchema = z.object({ url: z.url().max(2000).refine((value) => /^https?:\/\//.test(value), "URL ảnh không hợp lệ"), alt: z.string().trim().max(300).default("") });

export async function GET() {
  if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { db, close } = openStoreDb();
  try { return Response.json({ media: await db.select().from(storeMedia).orderBy(asc(storeMedia.id)) }); }
  finally { await close(); }
}

export async function POST(request: Request) {
  if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = externalSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "URL không hợp lệ" }, { status: 400 });
  const { db, close } = openStoreDb();
  try {
    const [media] = await db.insert(storeMedia).values({ ...parsed.data, storageKey: null }).onConflictDoUpdate({ target: storeMedia.url, set: { alt: parsed.data.alt } }).returning();
    return Response.json({ media });
  } finally { await close(); }
}

export async function mediaUsage(db: ReturnType<typeof openStoreDb>["db"], mediaId: number, url: string) {
  const [links, products, extraProducts, posts, settings] = await Promise.all([
    db.select({ name: storeProducts.name }).from(storeProductMedia).innerJoin(storeProducts, eq(storeProductMedia.productId, storeProducts.id)).where(eq(storeProductMedia.mediaId, mediaId)),
    db.select({ name: storeProducts.name }).from(storeProducts).where(eq(storeProducts.image, url)),
    db.select({ name: storeProducts.name, extraImages: storeProducts.extraImages }).from(storeProducts),
    db.select({ title: storePosts.title }).from(storePosts).where(eq(storePosts.image, url)),
    db.select({ id: storeShopSettings.id }).from(storeShopSettings).where(eq(storeShopSettings.vietQrUrl, url)),
  ]);
  const siteRow = (await db.select({ siteContent: storeShopSettings.siteContent }).from(storeShopSettings).where(eq(storeShopSettings.id, 1)).limit(1))[0];
  const site = mergeSiteContent(siteRow?.siteContent);
  const siteUsage = [site.brand.logo, site.brand.footerLogo, site.brand.favicon, site.seo.image, ...site.hero.map((slide) => slide.image), site.home.featureImage, ...site.home.categoryImages, ...site.home.journal.map((item) => item.image), ...site.testimonials.map((item) => item.image)].includes(url) ? ["Giao diện & Nội dung"] : [];
  return [...new Set([...links.map(({ name }) => `Sản phẩm: ${name}`), ...products.map(({ name }) => `Sản phẩm: ${name}`), ...extraProducts.filter(({ extraImages }) => extraImages.includes(url)).map(({ name }) => `Sản phẩm: ${name}`), ...posts.map(({ title }) => `Bài viết: ${title}`), ...settings.map(() => "Cấu hình VietQR"), ...siteUsage])];
}
