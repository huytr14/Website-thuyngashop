import { eq } from "drizzle-orm";
import { z } from "zod";
import { checkoutRateLimited, requestClient } from "@/app/checkout-rate-limit";
import { openStoreDb } from "@/db/store";
import { storeOrderItems, storeOrders } from "@/db/store-schema";

const inputSchema = z.object({ code: z.string().trim().toUpperCase().regex(/^TNG-\d{8}-[0-9A-Z]{4}$/), phone: z.string().trim().regex(/^0\d{8,10}$/) });
const notFound = () => Response.json({ error: "Không tìm thấy đơn hàng phù hợp với thông tin đã nhập" }, { status: 404 });

export async function POST(request: Request) {
  if (checkoutRateLimited(`track:${requestClient(request)}`)) return Response.json({ error: "Bạn tra cứu quá nhanh. Vui lòng thử lại sau." }, { status: 429 });
  const input = inputSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return notFound();
  const { db, close } = openStoreDb();
  try {
    const [order] = await db.select({ id: storeOrders.id, code: storeOrders.code, phone: storeOrders.phone, status: storeOrders.status, total: storeOrders.total, paymentMethod: storeOrders.paymentMethod }).from(storeOrders).where(eq(storeOrders.code, input.data.code)).limit(1);
    if (!order || order.phone !== input.data.phone) return notFound();
    const items = await db.select({ productName: storeOrderItems.productName, variantName: storeOrderItems.variantName, quantity: storeOrderItems.quantity, price: storeOrderItems.price }).from(storeOrderItems).where(eq(storeOrderItems.orderId, order.id));
    return Response.json({ order: { code: order.code, status: order.status, total: order.total, paymentMethod: order.paymentMethod, paymentStatus: order.paymentMethod === "COD" ? "Thanh toán khi nhận hàng" : "Chưa đối soát chuyển khoản", items } });
  } finally { await close(); }
}
