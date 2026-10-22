import { z } from "zod";
import { hasAdminSession } from "@/app/admin-auth";
import { openStoreDb } from "@/db/store";
import { storeShopSettings } from "@/db/store-schema";

const settingsSchema = z.object({
  freeShippingThreshold: z.coerce.number().int().min(0).max(1_000_000_000),
  standardShippingFee: z.coerce.number().int().min(0).max(10_000_000),
  bankName: z.string().trim().max(150), bankAccountName: z.string().trim().max(150),
  bankAccountNumber: z.string().trim().max(50), vietQrUrl: z.union([z.literal(""), z.url().max(2000)]),
  shopEmail: z.union([z.literal(""), z.email().max(255)]),
  aboutContent: z.string().trim().min(10).max(50000), contactContent: z.string().trim().min(10).max(50000),
  privacyPolicy: z.string().trim().min(10).max(50000), shippingPolicy: z.string().trim().min(10).max(50000),
  returnsPolicy: z.string().trim().min(10).max(50000), termsPolicy: z.string().trim().min(10).max(50000),
});

export async function PATCH(request: Request) {
  if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = settingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Cấu hình không hợp lệ" }, { status: 400 });
  const { db, close } = openStoreDb();
  try {
    const [settings] = await db.insert(storeShopSettings).values({ id: 1, ...parsed.data }).onConflictDoUpdate({ target: storeShopSettings.id, set: parsed.data }).returning();
    return Response.json({ settings });
  } finally { await close(); }
}
