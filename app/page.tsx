import Storefront from "./storefront";
import { getApprovedReviewSummaries, getShopSettings, getSiteContent, getStoreCatalog } from "@/db/store";

export const revalidate = 5;

export default async function Home() {
  const [catalog, settings, reviewSummaries, site] = await Promise.all([getStoreCatalog(), getShopSettings(), getApprovedReviewSummaries(), getSiteContent()]);
  const products = catalog.products.map(({ name, slug, image, price, inStock, brand }) => ({
    "@type": "Product", name, image, brand: { "@type": "Brand", name: brand },
    offers: { "@type": "Offer", priceCurrency: "VND", price, availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/san-pham/${slug}` },
  }));
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": products }).replace(/</g, "\\u003c") }}/><Storefront {...catalog} reviewSummaries={reviewSummaries} site={site} flashSettings={settings} policies={{ shipping: settings.shippingPolicy, returns: settings.returnsPolicy, contact: site.footer.contactContent }} /></>;
}
