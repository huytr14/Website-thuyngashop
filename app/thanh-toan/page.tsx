import type { Metadata } from "next";
import { getShopSettings, getSiteContent, getStoreCatalog } from "@/db/store";
import CheckoutPage from "./CheckoutPage";
import { pageMetadata } from "@/lib/site-metadata";
import { getCustomer } from "@/app/customer-session";
import { storeAddresses } from "@/db/store-schema";
import { openStoreDb } from "@/db/store";
import { eq } from "drizzle-orm";

export async function generateMetadata(): Promise<Metadata> { return { ...await pageMetadata("Thanh toán"), robots: { index: false, follow: false } }; }

export default async function ThanhToanPage() {
  const [catalog, settings, site] = await Promise.all([getStoreCatalog(), getShopSettings(), getSiteContent()]);
  const user = await getCustomer();
  let address: typeof storeAddresses.$inferSelect | undefined;
  if (user && process.env.DATABASE_URL) {
    const { db, close } = openStoreDb();
    try { address = (await db.select().from(storeAddresses).where(eq(storeAddresses.userId, user.id))).find((item) => item.isDefault); }
    finally { await close(); }
  }
  return <CheckoutPage products={catalog.products} settings={settings} site={site} prefill={user ? { email: user.email ?? "", customerName: user.name ?? "", phone: address?.phone ?? "", address: address?.address ?? "", city: address?.city ?? "", district: address?.district ?? "" } : undefined}/>;
}
