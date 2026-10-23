import { z } from "zod";
import { revalidatePath } from "next/cache";
import { hasAdminSession } from "@/app/admin-auth";
import { openStoreDb } from "@/db/store";
import { storeShopSettings } from "@/db/store-schema";

const settingsSchema = z.object({
  freeShippingThreshold: z.coerce.number().int().min(0).max(1_000_000_000),
  standardShippingFee: z.coerce.number().int().min(0).max(10_000_000),
  flashSaleTitle: z.string().trim().max(100).optional(),
  flashSaleStart: z.union([z.iso.datetime({ local: true }), z.literal("")]).optional().transform((value) => value === undefined ? undefined : value ? new Date(value) : null),
  flashSaleEnd: z.union([z.iso.datetime({ local: true }), z.literal("")]).optional().transform((value) => value === undefined ? undefined : value ? new Date(value) : null),
  bankName: z.string().trim().max(150), bankAccountName: z.string().trim().max(150),
  bankAccountNumber: z.string().trim().max(50), vietQrUrl: z.union([z.literal(""), z.url().max(2000), z.string().regex(/^\/media-file\/[0-9a-f-]{36}\.(?:jpg|png|webp|avif)$/)]),
  shopEmail: z.union([z.literal(""), z.email().max(255)]),
  aboutContent: z.string().trim().min(10).max(50000), contactContent: z.string().trim().min(10).max(50000),
  privacyPolicy: z.string().trim().min(10).max(50000), shippingPolicy: z.string().trim().min(10).max(50000),
  returnsPolicy: z.string().trim().min(10).max(50000), termsPolicy: z.string().trim().min(10).max(50000),
}).refine((value) => !value.flashSaleStart || !value.flashSaleEnd || value.flashSaleEnd > value.flashSaleStart, { path: ["flashSaleEnd"], message: "Giờ kết thúc Flash Sale phải sau giờ bắt đầu" });

export async function PATCH(request: Request) {
  if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = settingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Cấu hình không hợp lệ" }, { status: 400 });
  const { db, close } = openStoreDb();
  try {
    const [settings] = await db.insert(storeShopSettings).values({ id: 1, ...parsed.data }).onConflictDoUpdate({ target: storeShopSettings.id, set: parsed.data }).returning();
    revalidatePath("/"); revalidatePath("/san-pham/[slug]", "page"); revalidatePath("/danh-muc/[slug]", "page");
    return Response.json({ settings });
  } finally { await close(); }
}
