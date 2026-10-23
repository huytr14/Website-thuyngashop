import { asc, desc, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getCustomer } from "@/app/customer-session";
import PublicPage from "@/components/PublicPage";
import { getStoreCatalog, openStoreDb } from "@/db/store";
import { storeAddresses, storeOrderItems, storeOrders, storeReviews } from "@/db/store-schema";
import AccountClient from "./AccountClient";

export default async function AccountPage() {
  const user = await getCustomer();
  if (!user) redirect("/dang-nhap");
  const { db, close } = openStoreDb();
  try {
    const [addresses, orders] = await Promise.all([
      db.select().from(storeAddresses).where(eq(storeAddresses.userId, user.id)).orderBy(asc(storeAddresses.id)),
      db.select().from(storeOrders).where(eq(storeOrders.customerId, user.id)).orderBy(desc(storeOrders.createdAt)),
    ]);
    const orderIds = orders.map(({ id }) => id);
    const [items, reviews] = orderIds.length ? await Promise.all([
      db.select().from(storeOrderItems).where(inArray(storeOrderItems.orderId, orderIds)),
      db.select().from(storeReviews).where(eq(storeReviews.userId, user.id)),
    ]) : [[], []];
    return <PublicPage><AccountClient user={user} addresses={addresses} orders={orders} items={items} reviews={reviews} products={(await getStoreCatalog()).products.map(({ id, name, slug, image }) => ({ id, name, slug, image }))}/></PublicPage>;
  } finally { await close(); }
}
