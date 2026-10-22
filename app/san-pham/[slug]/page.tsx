import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getApprovedProductReviews, getApprovedReviewSummaries, getStoreCatalog } from "@/db/store";
import ProductPageClient from "./ProductPageClient";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = (await getStoreCatalog()).products.find((item) => item.slug === slug);
  return product ? { title: `${product.name} | THUYNGA Shop`, description: product.shortDescription || product.name, openGraph: { title: product.name, description: product.shortDescription || product.name, images: [product.image] } } : {};
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getStoreCatalog();
  const product = catalog.products.find((item) => item.slug === slug);
  if (!product) notFound();
  const [reviews, summaries] = await Promise.all([getApprovedProductReviews(product.id), getApprovedReviewSummaries()]);
  const related = catalog.products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 4);
  return <ProductPageClient product={product} products={catalog.products} related={related} reviews={reviews} summaries={summaries}/>;
}
