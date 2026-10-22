import { z } from "zod";
import { checkoutRateLimited, requestClient } from "@/app/checkout-rate-limit";
import { openStoreDb } from "@/db/store";
import { storeContactMessages } from "@/db/store-schema";

const contactSchema = z.object({ name: z.string().trim().min(2).max(150), email: z.string().trim().email().max(255), phone: z.string().trim().max(30).optional().default(""), message: z.string().trim().min(10).max(3000), turnstileToken: z.string().optional().default("") });

export async function POST(request: Request) {
  const client = requestClient(request); if (checkoutRateLimited(`contact:${client}`)) return Response.json({ error: "Bạn gửi quá nhiều yêu cầu. Vui lòng thử lại sau." }, { status: 429 });
  const parsed = contactSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return Response.json({ error: "Thông tin liên hệ không hợp lệ" }, { status: 400 });
  if (process.env.TURNSTILE_SECRET_KEY) {
    const body = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY, response: parsed.data.turnstileToken, remoteip: client });
    const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body }).then((response) => response.json()) as { success?: boolean };
    if (!result.success) return Response.json({ error: "Không thể xác minh chống spam" }, { status: 400 });
  }
  const { turnstileToken: _token, ...message } = parsed.data; const { db, close } = openStoreDb();
  try { await db.insert(storeContactMessages).values({ ...message, phone: message.phone || null }); return Response.json({ ok: true }, { status: 201 }); } finally { await close(); }
}
