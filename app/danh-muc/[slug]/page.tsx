import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteContent, getStoreCatalog } from "@/db/store";
import { categoryDescendants, visibleCategories } from "@/lib/categories";
import { pageMetadata } from "@/lib/site-metadata";
import CategoryPageClient from "./CategoryPageClient";

export const revalidate = 300;
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = visibleCategories((await getStoreCatalog()).categoryTree).find((item) => item.slug === slug);
  return category ? pageMetadata(category.name, category.description || `Mua sắm ${category.name} tại THUYNGA Shop`, category.image) : {};
}

export default async function CategoryPage({ params }: Props) {
  const [catalog, site] = await Promise.all([getStoreCatalog(), getSiteContent()]);
  const { slug } = await params;
  const category = visibleCategories(catalog.categoryTree).find((item) => item.slug === slug);
  if (!category) notFound();
  const ids = categoryDescendants(category, catalog.categoryTree);
  return <CategoryPageClient category={category} categoryTree={catalog.categoryTree} products={catalog.products.filter((item) => ids.includes(item.categoryId ?? -1))} allProducts={catalog.products} site={site}/>;
}
