import { existsSync } from "node:fs";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { storeMedia, storePosts, storeProductMedia, storeProducts, storeShopSettings } from "../db/store-schema.ts";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const client = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
const db = drizzle(client);
const descriptions = [
  "Tinh chất dưỡng da sang trọng giúp làn da ẩm mượt, tươi sáng mỗi ngày.", "Sữa rửa mặt nhẹ nhàng làm sạch mà vẫn giữ cảm giác mềm mại trên da.",
  "Bộ chăm sóc giúp nâng niu làn da sau những ngày cần phục hồi.", "Tinh dầu nuôi dưỡng mái tóc mềm mượt và thêm vẻ óng ả.",
  "Tinh chất chăm sóc da hằng ngày cho cảm giác mịn màng, dễ chịu.", "Mặt nạ ngủ giúp da được cấp ẩm và mềm mại khi thức dậy.",
  "Tinh chất dưỡng sáng hỗ trợ làn da trông đều màu và rạng rỡ.", "Nước dưỡng cân bằng mang lại cảm giác tươi mát, ẩm dịu cho da.",
  "Serum chăm sóc giúp làn da trông đều màu và tươi tắn hơn.", "Kem dưỡng ẩm giúp da mềm mịn và dễ chịu suốt ngày dài.",
  "Tinh dầu dưỡng da cho cảm giác căng bóng, mềm mại tự nhiên.", "Nước làm sạch dịu nhẹ giúp loại bỏ bụi bẩn hằng ngày.",
  "Bộ sản phẩm chăm sóc chuyên sâu dành cho những phút thư giãn tại nhà.", "Sắc son đỏ cổ điển tạo điểm nhấn thanh lịch cho mọi dịp.",
  "Tinh chất dưỡng ẩm mỏng nhẹ giúp da tươi mát và mềm mại.", "Sữa dưỡng thể mang lại cảm giác mềm mượt cho làn da.",
  "Tinh chất chăm sóc giúp da trông rạng rỡ và đầy sức sống.", "Kem dưỡng da hằng ngày cho làn da ẩm dịu, mềm mại.",
  "Bộ dưỡng da êm dịu thích hợp cho thói quen chăm sóc hằng ngày.", "Kem làm sạch và dưỡng ẩm giúp da sạch thoáng mà vẫn dễ chịu.",
  "Kem chăm sóc giúp làn da trông săn mịn và tươi tắn.", "Kem dưỡng dành cho da khô, giúp giữ cảm giác ẩm mềm.",
  "Tinh chất dưỡng da cho vẻ ngoài sáng khỏe, tự nhiên.", "Kem dưỡng cao cấp mang đến trải nghiệm chăm sóc da tinh tế.",
  "Bộ trang điểm thanh lịch giúp hoàn thiện diện mạo nhẹ nhàng.", "Màu son hồng đất dịu dàng, dễ kết hợp cho mỗi ngày.",
  "Phấn trang điểm cho lớp nền tự nhiên và vẻ ngoài tươi tắn.", "Bộ chăm sóc giúp mái tóc thêm suôn mượt và óng ả.",
  "Dưỡng thể dịu nhẹ giúp làn da mềm mại sau mỗi lần sử dụng.", "Bộ dưỡng da giúp nuôi dưỡng cảm giác mềm mịn, ẩm dịu.",
];

try {
  const [products, posts, settings] = await Promise.all([db.select().from(storeProducts), db.select({ image: storePosts.image }).from(storePosts), db.select({ vietQrUrl: storeShopSettings.vietQrUrl }).from(storeShopSettings)]);
  const urls = [...new Set([...products.flatMap(({ image, extraImages }) => [image, ...extraImages]), ...posts.map(({ image }) => image), ...settings.map(({ vietQrUrl }) => vietQrUrl)].filter(Boolean))];
  for (const url of urls) await db.insert(storeMedia).values({ url, alt: "" }).onConflictDoNothing();
  const media = await db.select({ id: storeMedia.id, url: storeMedia.url }).from(storeMedia);
  const byUrl = new Map(media.map(({ id, url }) => [url, id]));
  for (const product of products) {
    const current = await db.select({ mediaId: storeProductMedia.mediaId }).from(storeProductMedia).where(eq(storeProductMedia.productId, product.id));
    if (!current.length) {
      const images = [...new Set([product.image, ...product.extraImages].filter(Boolean))];
      for (const [sortOrder, url] of images.entries()) await db.insert(storeProductMedia).values({ productId: product.id, mediaId: byUrl.get(url)!, sortOrder }).onConflictDoNothing();
    }
    if (product.id <= 30 && !product.shortDescription) await db.update(storeProducts).set({ shortDescription: descriptions[product.id - 1] }).where(eq(storeProducts.id, product.id));
  }
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(storeMedia);
  console.log(`Media migration complete: ${count} records; ${products.filter((item) => item.id <= 30 && !item.shortDescription).length} product descriptions filled.`);
} finally { await client.end(); }
