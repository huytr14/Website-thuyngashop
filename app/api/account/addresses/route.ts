import { eq } from "drizzle-orm";
import { z } from "zod";
import { getCustomer } from "@/app/customer-session";
import { openStoreDb } from "@/db/store";
import { storeAddresses } from "@/db/store-schema";

const addressSchema = z.object({ recipientName: z.string().trim().min(2).max(150), phone: z.string().regex(/^0\d{8,10}$/), address: z.string().trim().min(5).max(500), district: z.string().trim().min(2).max(100), city: z.string().trim().min(2).max(100), isDefault: z.union([z.literal("true"), z.boolean()]).optional().transform((value) => value === true || value === "true") });

export async function POST(request: Request) {
  const user = await getCustomer(request); if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = addressSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return Response.json({ error: "Địa chỉ không hợp lệ" }, { status: 400 });
  const { db, close } = openStoreDb(); try {
    if (parsed.data.isDefault) await db.update(storeAddresses).set({ isDefault: false }).where(eq(storeAddresses.userId, user.id));
    const [address] = await db.insert(storeAddresses).values({ ...parsed.data, userId: user.id }).returning(); return Response.json({ address }, { status: 201 });
  } finally { await close(); }
}
