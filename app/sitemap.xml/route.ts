import { eq } from "drizzle-orm";
import { getStoreCatalog, openStoreDb } from "@/db/store";
import { storePosts } from "@/db/store-schema";
import { visibleCategories } from "@/lib/categories";

export async function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const paths = ["", "/gioi-thieu", "/lien-he", "/tin-tuc", "/chinh-sach/bao-mat", "/chinh-sach/van-chuyen", "/chinh-sach/doi-tra", "/chinh-sach/dieu-khoan"];
  let posts: { slug: string; updatedAt: Date }[] = [];
  if (process.env.DATABASE_URL) {
    const { db, close } = openStoreDb();
    try { posts = await db.select({ slug: storePosts.slug, updatedAt: storePosts.updatedAt }).from(storePosts).where(eq(storePosts.published, true)); }
    finally { await close(); }
  }
  const catalog = await getStoreCatalog();
  const urls = [...paths.map((path) => `<url><loc>${base}${path}</loc></url>`), ...visibleCategories(catalog.categoryTree).map((category) => `<url><loc>${base}/danh-muc/${category.slug}</loc></url>`), ...catalog.products.map((product) => `<url><loc>${base}/san-pham/${product.slug}</loc></url>`), ...posts.map((post) => `<url><loc>${base}/tin-tuc/${post.slug}</loc><lastmod>${post.updatedAt.toISOString()}</lastmod></url>`)];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`, { headers: { "Content-Type": "application/xml" } });
}
