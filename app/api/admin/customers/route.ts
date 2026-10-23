import { asc, desc } from "drizzle-orm";
import { hasAdminSession } from "@/app/admin-auth";
import { openStoreDb } from "@/db/store";
import { storeAddresses, storeOrders, storeUsers } from "@/db/store-schema";

export async function GET() {
  if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { db, close } = openStoreDb();
  try {
    const [users, orders, addresses] = await Promise.all([
      db.select({ id: storeUsers.id, name: storeUsers.name, email: storeUsers.email, createdAt: storeUsers.createdAt }).from(storeUsers).orderBy(asc(storeUsers.createdAt)),
      db.select({ id: storeOrders.id, customerId: storeOrders.customerId, code: storeOrders.code, phone: storeOrders.phone, total: storeOrders.total, status: storeOrders.status, createdAt: storeOrders.createdAt }).from(storeOrders).orderBy(desc(storeOrders.createdAt)),
      db.select({ userId: storeAddresses.userId, phone: storeAddresses.phone }).from(storeAddresses),
    ]);
    const customers = users.map((user) => { const own = orders.filter((order) => order.customerId === user.id); return { ...user, phone: own[0]?.phone ?? addresses.find((address) => address.userId === user.id)?.phone ?? "", orderCount: own.length, totalSpent: own.filter((order) => order.status !== "HUY").reduce((sum, order) => sum + order.total, 0), orders: own }; });
    return Response.json({ customers });
  } finally { await close(); }
}
