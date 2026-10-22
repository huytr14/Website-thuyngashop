import { getToken } from "@auth/core/jwt";
import { headers } from "next/headers";

export async function getCustomer(request?: Request) {
  const req = request ?? { headers: await headers() };
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  const token = await getToken({ req, secret }) ?? await getToken({ req, secret, secureCookie: true });
  return token?.id ? { id: String(token.id), name: token.name ?? null, email: token.email ?? null } : null;
}
