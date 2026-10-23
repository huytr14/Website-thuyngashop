import { eq, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hasAdminSession } from "@/app/admin-auth";
import { openStoreDb, getSiteContent } from "@/db/store";
import { storeCategories, storeMedia, storeShopSettings } from "@/db/store-schema";
import { defaultSiteContent, siteContentSchema } from "@/lib/site-content";

export async function GET() {
  if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ site: await getSiteContent() });
}

export async function PATCH(request: Request) {
  if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = siteContentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 });
  const { db, close } = openStoreDb();
  try {
    const roots = await db.select({ slug: storeCategories.slug }).from(storeCategories).where(isNull(storeCategories.parentId));
    if (parsed.data.departmentRails.some((rail) => !roots.some((root) => root.slug === rail.categorySlug))) return Response.json({ error: "Rail phải chọn danh mục gốc có sẵn" }, { status: 400 });
    const images = [parsed.data.brand.logo, parsed.data.brand.footerLogo, parsed.data.brand.favicon, parsed.data.seo.image, ...parsed.data.hero.map((slide) => slide.image), parsed.data.home.featureImage, ...parsed.data.home.categoryImages, ...parsed.data.home.journal.map((item) => item.image), ...parsed.data.testimonials.map((item) => item.image)].filter(Boolean);
    const stored = images.length ? await db.select({ url: storeMedia.url }).from(storeMedia).where(inArray(storeMedia.url, [...new Set(images)])) : [];
    if (stored.length !== new Set(images).size) {
      const legacyImages = ["/shiseido-eudermine-reference.png", "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&q=85", "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1400&q=85", "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=1000&q=85", "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1000&q=85", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=85", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=950&q=85", "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=950&q=85", "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=950&q=85"];
      const defaults = new Set([defaultSiteContent.brand.logo, defaultSiteContent.seo.image, ...defaultSiteContent.hero.map((slide) => slide.image), defaultSiteContent.home.featureImage, ...defaultSiteContent.home.categoryImages, ...defaultSiteContent.home.journal.map((item) => item.image), ...legacyImages]);
      if (images.some((image) => !defaults.has(image) && !stored.some((item) => item.url === image))) return Response.json({ error: "Ảnh phải được chọn từ kho" }, { status: 400 });
    }
    if (parsed.data.brand.favicon) {
      const [favicon] = await db.select().from(storeMedia).where(eq(storeMedia.url, parsed.data.brand.favicon)).limit(1);
      if (!favicon?.storageKey || !favicon.width || favicon.width !== favicon.height) return Response.json({ error: "Favicon phải là ảnh vuông đã tải lên kho" }, { status: 400 });
    }
    await db.insert(storeShopSettings).values({ id: 1, siteContent: parsed.data, contactContent: parsed.data.footer.contactContent }).onConflictDoUpdate({ target: storeShopSettings.id, set: { siteContent: parsed.data, contactContent: parsed.data.footer.contactContent } });
    revalidatePath("/", "layout");
    return Response.json({ site: parsed.data });
  } finally { await close(); }
}
