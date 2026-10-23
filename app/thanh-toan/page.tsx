import type { Metadata } from "next";
import { getShopSettings, getSiteContent, getStoreCatalog } from "@/db/store";
import CheckoutPage from "./CheckoutPage";
import { pageMetadata } from "@/lib/site-metadata";

export async function generateMetadata(): Promise<Metadata> { return { ...await pageMetadata("Thanh toán"), robots: { index: false, follow: false } }; }

export default async function ThanhToanPage() {
  const [catalog, settings, site] = await Promise.all([getStoreCatalog(), getShopSettings(), getSiteContent()]);
  return <CheckoutPage products={catalog.products} settings={settings} site={site}/>;
}
