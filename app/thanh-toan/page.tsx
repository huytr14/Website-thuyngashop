import type { Metadata } from "next";
import { getShopSettings, getStoreCatalog } from "@/db/store";
import CheckoutPage from "./CheckoutPage";

export const metadata: Metadata = { title: "Thanh toán | THUYNGA Shop", robots: { index: false, follow: false }, openGraph: { title: "Thanh toán | THUYNGA Shop" } };

export default async function ThanhToanPage() {
  const [catalog, settings] = await Promise.all([getStoreCatalog(), getShopSettings()]);
  return <CheckoutPage products={catalog.products} settings={settings}/>;
}
