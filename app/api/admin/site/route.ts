import { eq, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hasAdminSession } from "@/app/admin-auth";
import { openStoreDb, getSiteContent } from "@/db/store";
import { storeCategories, storeMedia, storeShopSettings } from "@/db/store-schema";
import { defaultSiteContent, siteContentSchema } from "@/lib/site-content";
import { fieldIssue, invalidFields } from "@/lib/admin-validation";

export async function GET() {
  if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ site: await getSiteContent() });
}

export async function PATCH(request: Request) {
  if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = siteContentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return invalidFields(parsed.error);
  const { db, close } = openStoreDb();
  try {
    const roots = await db.select({ slug: storeCategories.slug }).from(storeCategories).where(isNull(storeCategories.parentId));
    const badRail = parsed.data.departmentRails.findIndex((rail) => !roots.some((root) => root.slug === rail.categorySlug));
    if (badRail >= 0) return fieldIssue(`departmentRails.${badRail}.categorySlug`, "Rail phải chọn danh mục gốc có sẵn");
    const imageFields: [string, string][] = [["brand.logo", parsed.data.brand.logo], ["brand.footerLogo", parsed.data.brand.footerLogo], ["brand.favicon", parsed.data.brand.favicon], ["seo.image", parsed.data.seo.image], ...parsed.data.hero.map((slide, index): [string, string] => [`hero.${index}.image`, slide.image]), ["home.featureImage", parsed.data.home.featureImage], ...parsed.data.home.categoryImages.map((image, index): [string, string] => [`home.categoryImages.${index}`, image]), ...parsed.data.home.journal.map((item, index): [string, string] => [`home.journal.${index}.image`, item.image]), ...parsed.data.testimonials.map((item, index): [string, string] => [`testimonials.${index}.image`, item.image])];
    const images = imageFields.map(([, image]) => image).filter(Boolean);
    const stored = images.length ? await db.select({ url: storeMedia.url }).from(storeMedia).where(inArray(storeMedia.url, [...new Set(images)])) : [];
    if (stored.length !== new Set(images).size) {
      const legacyImages = ["/shiseido-eudermine-reference.png", "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&q=85", "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1400&q=85", "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=1000&q=85", "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1000&q=85", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=85", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=950&q=85", "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=950&q=85", "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=950&q=85"];
      const defaults = new Set([defaultSiteContent.brand.logo, defaultSiteContent.seo.image, ...defaultSiteContent.hero.map((slide) => slide.image), defaultSiteContent.home.featureImage, ...defaultSiteContent.home.categoryImages, ...defaultSiteContent.home.journal.map((item) => item.image), ...legacyImages]);
      const invalid = imageFields.find(([, image]) => image && !defaults.has(image) && !stored.some((item) => item.url === image));
      if (invalid) return fieldIssue(invalid[0], "Ảnh phải được chọn từ kho");
    }
    if (parsed.data.brand.favicon) {
      const [favicon] = await db.select().from(storeMedia).where(eq(storeMedia.url, parsed.data.brand.favicon)).limit(1);
      if (!favicon?.storageKey || !favicon.width || favicon.width !== favicon.height) return fieldIssue("brand.favicon", "Favicon phải là ảnh vuông đã tải lên kho");
    }
    await db.insert(storeShopSettings).values({ id: 1, siteContent: parsed.data, contactContent: parsed.data.footer.contactContent }).onConflictDoUpdate({ target: storeShopSettings.id, set: { siteContent: parsed.data, contactContent: parsed.data.footer.contactContent } });
    revalidatePath("/", "layout");
    return Response.json({ site: parsed.data });
  } finally { await close(); }
}
