import { desc } from "drizzle-orm";
import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { customers, orders, products } from "../../../db/schema";

export async function GET() {
  if (!(await getChatGPTUser())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const db=getDb();
  const [productRows,orderRows,customerRows]=await Promise.all([
    db.select().from(products).orderBy(desc(products.id)),
    db.select().from(orders).orderBy(desc(orders.id)),
    db.select().from(customers).orderBy(desc(customers.spent)),
  ]);
  return Response.json({products:productRows,orders:orderRows,customers:customerRows});
}
