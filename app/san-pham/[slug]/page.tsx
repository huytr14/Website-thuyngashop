import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getApprovedProductReviews, getApprovedReviewSummaries, getSiteContent, getStoreCatalog } from "@/db/store";
import ProductPageClient from "./ProductPageClient";
import { pageMetadata } from "@/lib/site-metadata";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = (await getStoreCatalog()).products.find((item) => item.slug === slug);
  if (!product) return {};
  const metadata = await pageMetadata(product.name, product.seoDescription || product.shortDescription || product.name, product.image);
  return product.seoTitle ? { ...metadata, title: { absolute: product.seoTitle }, openGraph: { ...metadata.openGraph, title: product.seoTitle } } : metadata;
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getStoreCatalog();
  const product = catalog.products.find((item) => item.slug === slug);
  if (!product) notFound();
  const [reviews, summaries, site] = await Promise.all([getApprovedProductReviews(product.id), getApprovedReviewSummaries(), getSiteContent()]);
  const related = catalog.products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 4);
  const jsonLd = { "@context": "https://schema.org", "@type": "Product", name: product.name, image: product.image, brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined, offers: { "@type": "Offer", priceCurrency: "VND", price: product.price, availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" } };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}/><ProductPageClient product={product} products={catalog.products} categoryTree={catalog.categoryTree} related={related} reviews={reviews} summaries={summaries} site={site}/></>;
}
