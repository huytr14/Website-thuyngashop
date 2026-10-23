import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hasAdminSession } from "@/app/admin-auth";
import { openStoreDb } from "@/db/store";
import { storeOrderItems, storeOrders } from "@/db/store-schema";
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
    const current = (await db.select({ status: storeOrders.status }).from(storeOrders).where(eq(storeOrders.id, id.data)).limit(1))[0];
    if (!current) return Response.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
    if (!canChangeOrderStatus(current.status as OrderStatus, input.data.status)) return Response.json({ error: "Không thể chuyển sang trạng thái này" }, { status: 409 });
    const [order] = await db.update(storeOrders).set({ status: input.data.status }).where(eq(storeOrders.id, id.data)).returning();
    revalidatePath("/"); revalidatePath("/san-pham/[slug]", "page");
    return Response.json({ order });
  } finally { await close(); }
}
