import { existsSync } from "node:fs";
import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { categories, products } from "../catalog/products.ts";
import { storeCategories, storeProducts, storeShopSettings } from "../db/store-schema.ts";
import { defaultSiteContent } from "../lib/site-content.ts";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required in .env.local");
if (new Set(products.map(({ slug }) => slug)).size !== products.length) throw new Error("Product slugs must be unique");

const client = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
const db = drizzle(client);
const legacyNames = ["Eudermine Activating Essence", "Sữa rửa mặt dịu nhẹ", "Bộ chăm sóc da phục hồi", "Tinh dầu chăm sóc tóc", "Tinh chất dưỡng da hằng ngày", "Mặt nạ ngủ cấp ẩm", "Tinh chất dưỡng sáng làn da", "Nước dưỡng da cân bằng", "Serum chăm sóc da đều màu", "Kem dưỡng ẩm mềm mịn", "Tinh dầu dưỡng da căng bóng", "Nước làm sạch dịu nhẹ", "Bộ chăm sóc da chuyên sâu", "Son môi sắc đỏ cổ điển", "Tinh chất dưỡng ẩm tươi mát", "Sữa dưỡng thể mềm mượt", "Tinh chất chăm sóc da rạng rỡ", "Kem dưỡng da hằng ngày", "Bộ dưỡng da êm dịu", "Kem làm sạch và dưỡng ẩm", "Kem chăm sóc da săn mịn", "Kem dưỡng da khô", "Tinh chất dưỡng da sáng khỏe", "Kem dưỡng cao cấp", "Bộ trang điểm thanh lịch", "Son môi màu hồng đất", "Phấn trang điểm tự nhiên", "Bộ chăm sóc tóc suôn mượt", "Dưỡng thể dịu nhẹ", "Bộ dưỡng da mềm mịn"];
const legacySlug = (name: string) => name.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

try {
  await db.insert(storeShopSettings).values({ id: 1 }).onConflictDoNothing();
  const [settings] = await db.select().from(storeShopSettings).where(eq(storeShopSettings.id, 1));
  const site = settings.siteContent;
  if (settings.aboutContent === "THUYNGA Shop tuyển chọn những sản phẩm làm đẹp phù hợp cho nhịp sống hiện đại.") await db.update(storeShopSettings).set({ aboutContent: "THUYNGA Shop — hàng nhập khẩu chính hãng: thực phẩm chức năng, thực phẩm, trái cây, mỹ phẩm và chăm sóc cá nhân." }).where(eq(storeShopSettings.id, 1));
  if (site?.announcement?.kicker === "THUYNGA BEAUTY EDIT" && site.hero?.length === 2 && site.hero[0].title === "SẮC ĐỎ" && site.hero[0].image === "/shiseido-eudermine-reference.png" && site.hero[1].title === "CHẠM VÀO") {
    // ponytail: chỉ nâng nội dung demo cũ nhận diện được; nội dung CMS đã tùy chỉnh cần shop duyệt trong admin.
    await db.update(storeShopSettings).set({ siteContent: { ...defaultSiteContent, brand: { ...defaultSiteContent.brand, ...site.brand }, footer: { ...defaultSiteContent.footer, address: site.footer?.address ?? "", hotline: site.footer?.hotline ?? "", email: site.footer?.email ?? "", hours: site.footer?.hours ?? "", facebook: site.footer?.facebook ?? "", instagram: site.footer?.instagram ?? "", zalo: site.footer?.zalo ?? "", tiktok: site.footer?.tiktok ?? "", youtube: site.footer?.youtube ?? "", contactContent: site.footer?.contactContent ?? defaultSiteContent.footer.contactContent }, testimonials: site.testimonials ?? [] } }).where(eq(storeShopSettings.id, 1));
  }
  for (const category of categories.filter(({ parentId }) => !parentId)) {
    await db.insert(storeCategories).values({ name: category.name, slug: category.slug, sortOrder: category.sortOrder, requiresDisclaimer: category.requiresDisclaimer }).onConflictDoNothing();
  }
  let categoryRows = await db.select().from(storeCategories);
  const rootIds = new Map(categoryRows.map(({ id, slug }) => [slug, id]));
  for (const category of categories.filter(({ parentId }) => parentId)) {
    const parent = categories.find(({ id }) => id === category.parentId)!;
    const parentId = rootIds.get(parent.slug);
    if (!parentId) throw new Error(`Missing parent ${parent.name}`);
    const existing = categoryRows.find((item) => item.slug === category.slug);
    if (existing && !existing.parentId && ["cham-soc-da", "trang-diem"].includes(category.slug)) await db.update(storeCategories).set({ parentId, sortOrder: category.sortOrder }).where(eq(storeCategories.id, existing.id));
    else if (!existing) await db.insert(storeCategories).values({ name: category.name, slug: category.slug, parentId, sortOrder: category.sortOrder }).onConflictDoNothing();
  }
  // ponytail: chỉ ẩn danh mục demo cũ, không xóa sản phẩm đang liên kết; chuyển thủ công nếu shop cần đăng bán lại.
  await db.update(storeCategories).set({ isVisible: false }).where(eq(storeCategories.slug, "toc-co-the"));
  categoryRows = await db.select().from(storeCategories);
  const categoryIds = new Map(categoryRows.map(({ id, slug }) => [slug, id]));
  const legacyRows = await db.select({ id: storeProducts.id, name: storeProducts.name, slug: storeProducts.slug }).from(storeProducts);
  const legacyIds = legacyRows.filter((row) => legacyNames.includes(row.name) && row.slug === legacySlug(row.name)).map((row) => row.id);
  if (legacyIds.length) await db.update(storeProducts).set({ published: false }).where(inArray(storeProducts.id, legacyIds));

  for (const product of products) {
    const categoryId = categoryIds.get(categories.find(({ id }) => id === product.categoryId)?.slug ?? "");
    if (!categoryId) throw new Error(`Missing category for ${product.name}`);
    const values = { ...product, badge: product.badge ?? null, categoryId };
    const { category: _category, id: _id, ...row } = values;
    // ponytail: seed không ghi đè sản phẩm đã được shop sửa; cập nhật mẫu qua admin nếu cần.
    await db.insert(storeProducts).values(row).onConflictDoNothing();
    if (product.variantRows?.length || product.extraImages.length) {
      const existing = (await db.select({ id: storeProducts.id, variantRows: storeProducts.variantRows, extraImages: storeProducts.extraImages }).from(storeProducts).where(eq(storeProducts.slug, product.slug)).limit(1))[0];
      if (existing) { const enrichment = { ...(product.variantRows?.length && !existing.variantRows.length ? { variantOptions: product.variantOptions, variantRows: product.variantRows } : {}), ...(product.extraImages.length && !existing.extraImages.length ? { extraImages: product.extraImages } : {}) }; if (Object.keys(enrichment).length) await db.update(storeProducts).set(enrichment).where(eq(storeProducts.id, existing.id)); }
    }
  }

  console.log(`Seeded ${categories.length} categories and ${products.length} products.`);
} finally {
  await client.end();
}
