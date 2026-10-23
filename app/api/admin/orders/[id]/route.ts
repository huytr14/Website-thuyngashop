import { asc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hasAdminSession } from "@/app/admin-auth";
import { openStoreDb } from "@/db/store";
import { storeOrderItems, storeOrders, storeProducts } from "@/db/store-schema";
import { canChangeOrderStatus, type OrderStatus } from "@/lib/commerce";

const idSchema = z.coerce.number().int().positive();
const statusSchema = z.object({ status: z.enum(["MOI", "DA_XAC_NHAN", "DANG_GIAO", "HOAN_THANH", "HUY"]) });

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const id = idSchema.safeParse((await params).id);
  if (!id.success) return Response.json({ error: "ID không hợp lệ" }, { status: 400 });
  const { db, close } = openStoreDb();
  try {
    const order = (await db.select().from(storeOrders).where(eq(storeOrders.id, id.data)).limit(1))[0];
    if (!order) return Response.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
    const items = await db.select().from(storeOrderItems).where(eq(storeOrderItems.orderId, id.data));
    return Response.json({ order, items });
  } finally { await close(); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const id = idSchema.safeParse((await params).id);
  const input = statusSchema.safeParse(await request.json().catch(() => null));
  if (!id.success || !input.success) return Response.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  const { db, close } = openStoreDb();
  try {
    const order = await db.transaction(async (tx) => {
      const current = (await tx.select({ status: storeOrders.status }).from(storeOrders).where(eq(storeOrders.id, id.data)).for("update").limit(1))[0];
      if (!current) return { error: "Không tìm thấy đơn hàng", status: 404 } as const;
      if (!canChangeOrderStatus(current.status as OrderStatus, input.data.status)) return { error: "Không thể chuyển sang trạng thái này", status: 409 } as const;
      if (input.data.status === "HUY") {
        const items = await tx.select().from(storeOrderItems).where(eq(storeOrderItems.orderId, id.data));
        const productIds = [...new Set(items.map(({ productId }) => productId).filter((value): value is number => value !== null))];
        const products = productIds.length ? await tx.select().from(storeProducts).where(inArray(storeProducts.id, productIds)).orderBy(asc(storeProducts.id)).for("update") : [];
        for (const product of products) {
          const sold = items.filter((item) => item.productId === product.id);
          const inventoryQuantity = product.inventoryQuantity + sold.filter((item) => item.inventoryDeducted).reduce((sum, item) => sum + item.quantity, 0);
          const variantRows = product.variantRows.map((row) => ({ ...row, quantity: row.quantity + sold.filter((item) => item.inventoryDeducted && item.variantName === row.name).reduce((sum, item) => sum + item.quantity, 0) }));
          const flashStock = product.flashStock === null ? null : product.flashStock + sold.filter((item) => item.flashStockDeducted).reduce((sum, item) => sum + item.quantity, 0);
          await tx.update(storeProducts).set({ inventoryQuantity, variantRows, flashStock, inStock: product.trackInventory ? inventoryQuantity > 0 && (!variantRows.length || variantRows.some((row) => row.quantity > 0)) : product.inStock }).where(eq(storeProducts.id, product.id));
        }
      }
      const [updated] = await tx.update(storeOrders).set({ status: input.data.status }).where(eq(storeOrders.id, id.data)).returning();
      return { order: updated } as const;
    });
    if ("error" in order) return Response.json({ error: order.error }, { status: order.status });
    revalidatePath("/"); revalidatePath("/san-pham/[slug]", "page");
    return Response.json(order);
  } finally { await close(); }
}
