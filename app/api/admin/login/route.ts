import { z } from "zod";
import { setAdminSession, validateAdminPassword } from "@/app/admin-auth";
import { clearLoginAttempts, isLoginRateLimited, recordFailedLogin } from "@/app/login-rate-limit";

const loginSchema = z.object({ password: z.string().min(1).max(200) });

export async function POST(request: Request) {
  const client = `admin-login:${request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown"}`;
  if (isLoginRateLimited(client)) return Response.redirect(new URL("/admin?rate=1", request.url), 303);
  const parsed = loginSchema.safeParse(Object.fromEntries(await request.formData().catch(() => new FormData())));
  if (!parsed.success || !await validateAdminPassword(parsed.data.password)) {
    recordFailedLogin(client);
    return Response.redirect(new URL("/admin?error=1", request.url), 303);
  }
  clearLoginAttempts(client);
  await setAdminSession();
  return Response.redirect(new URL("/admin", request.url), 303);
}
