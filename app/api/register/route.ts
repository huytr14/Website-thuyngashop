import { eq } from "drizzle-orm";
import { z } from "zod";
import { checkoutRateLimited, requestClient } from "@/app/checkout-rate-limit";
import { openStoreDb } from "@/db/store";
import { storeUsers } from "@/db/store-schema";
import { hashPassword } from "@/lib/password";

const registrationSchema = z.object({
  name: z.string().trim().min(2).max(150), email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8).max(128).regex(/[A-Za-z]/, "Mật khẩu cần có chữ").regex(/\d/, "Mật khẩu cần có số"),
});

export async function POST(request: Request) {
  if (checkoutRateLimited(`register:${requestClient(request)}`)) return Response.json({ error: "Bạn thao tác quá nhanh. Vui lòng thử lại sau." }, { status: 429 });
  const parsed = registrationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Thông tin đăng ký không hợp lệ" }, { status: 400 });
  const { db, close } = openStoreDb();
  try {
    if ((await db.select({ id: storeUsers.id }).from(storeUsers).where(eq(storeUsers.email, parsed.data.email)).limit(1))[0]) return Response.json({ error: "Email đã được sử dụng" }, { status: 409 });
    await db.insert(storeUsers).values({ name: parsed.data.name, email: parsed.data.email, passwordHash: await hashPassword(parsed.data.password) });
    return Response.json({ ok: true }, { status: 201 });
  } finally { await close(); }
}
