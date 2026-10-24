import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { hasAdminSession } from "@/app/admin-auth";
import { openStoreDb } from "@/db/store";
import { storeVouchers } from "@/db/store-schema";
import { fieldIssue, invalidFields } from "@/lib/admin-validation";

export const voucherSchema = z.object({
  code: z.string().trim().min(2).max(50).regex(/^[A-Za-z0-9_-]+$/, "Mã chỉ gồm chữ, số, _ và -").transform((value) => value.toUpperCase()),
  type: z.enum(["PERCENT", "FIXED", "FREESHIP"]),
  value: z.coerce.number().int().min(0).max(1_000_000_000),
  minOrder: z.coerce.number().int().min(0).max(1_000_000_000),
  startsAt: z.union([z.iso.datetime(), z.null()]).transform((value) => value ? new Date(value) : null),
  expiresAt: z.union([z.iso.datetime(), z.null()]).transform((value) => value ? new Date(value) : null),
  usageLimit: z.number().int().positive().nullable(),
  perCustomerLimit: z.number().int().positive().nullable(),
  active: z.boolean(),
}).superRefine((value, context) => {
  if (value.type === "PERCENT" && (value.value < 1 || value.value > 100)) context.addIssue({ code: "custom", path: ["value"], message: "Giảm theo % phải từ 1 đến 100" });
  if (value.type === "FIXED" && value.value < 1) context.addIssue({ code: "custom", path: ["value"], message: "Số tiền giảm phải lớn hơn 0" });
  if (value.startsAt && value.expiresAt && value.startsAt >= value.expiresAt) context.addIssue({ code: "custom", path: ["expiresAt"], message: "Ngày kết thúc phải sau ngày bắt đầu" });
});

export async function GET() {
  if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { db, close } = openStoreDb();
  try { return Response.json({ vouchers: await db.select().from(storeVouchers).orderBy(asc(storeVouchers.id)) }); }
  finally { await close(); }
}

export async function POST(request: Request) {
  if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = voucherSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return invalidFields(parsed.error);
  const { db, close } = openStoreDb();
  try {
    if ((await db.select({ id: storeVouchers.id }).from(storeVouchers).where(eq(storeVouchers.code, parsed.data.code)).limit(1)).length) return fieldIssue("code", "Mã giảm giá đã tồn tại", 409);
    const [voucher] = await db.insert(storeVouchers).values(parsed.data).returning();
    return Response.json({ voucher }, { status: 201 });
  } catch (error) { if ((error as { code?: string }).code === "23505") return fieldIssue("code", "Mã giảm giá đã tồn tại", 409); throw error; }
  finally { await close(); }
}
