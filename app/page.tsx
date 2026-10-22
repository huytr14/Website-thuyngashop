import Storefront from "./storefront";
import { getStoreCatalog } from "@/db/store";

export const revalidate = 300;

export default async function Home() {
  const catalog = await getStoreCatalog();
  const products = catalog.products.map(({ id, name, image, price, inStock, brand }) => ({
    "@type": "Product", name, image, brand: { "@type": "Brand", name: brand },
    offers: { "@type": "Offer", priceCurrency: "VND", price, availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/#san-pham-${id}` },
  }));
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": products }).replace(/</g, "\\u003c") }}/><Storefront {...catalog} /></>;
}
