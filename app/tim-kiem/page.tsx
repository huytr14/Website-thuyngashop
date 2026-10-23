import type { Metadata } from "next";
import { getApprovedReviewSummaries, getShopSettings, getSiteContent, getStoreCatalog } from "@/db/store";
import CategoryPageClient from "@/app/danh-muc/[slug]/CategoryPageClient";

export const metadata: Metadata = { title: "Tìm kiếm", robots: { index: false, follow: true } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = (await searchParams).q?.trim().slice(0, 100) ?? "";
  const [catalog, summaries, settings, site] = await Promise.all([getStoreCatalog(), getApprovedReviewSummaries(), getShopSettings(), getSiteContent()]);
  const needle = query.toLocaleLowerCase("vi-VN");
  const products = query ? catalog.products.filter((item) => `${item.name} ${item.brand} ${item.category}`.toLocaleLowerCase("vi-VN").includes(needle)) : [];
  const category = { id: 0, name: query ? `Kết quả tìm kiếm: ${query}` : "Tìm kiếm sản phẩm", slug: "tim-kiem", description: "", parentId: null, image: "", sortOrder: 0, isVisible: true, requiresDisclaimer: false };
  return <CategoryPageClient category={category} categoryTree={catalog.categoryTree} products={products} allProducts={catalog.products} site={site} summaries={summaries} flashSettings={settings}/>;
}
