import { cookies } from "next/headers";

const COOKIE_NAME = "thuynga_admin_session";
const encoder = new TextEncoder();

async function digest(value: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function equal(left: string, right: string) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index++) result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return result === 0;
}

async function expectedToken() {
  return process.env.ADMIN_PASSWORD ? digest(`thuyngashop:${process.env.ADMIN_PASSWORD}`) : null;
}

export async function validateAdminPassword(password: string) {
  if (!process.env.ADMIN_PASSWORD) return false;
  return equal(await digest(`thuyngashop:${password}`), await digest(`thuyngashop:${process.env.ADMIN_PASSWORD}`));
}

export async function hasAdminSession() {
  const expected = await expectedToken();
  const actual = (await cookies()).get(COOKIE_NAME)?.value;
  return Boolean(expected && actual && equal(actual, expected));
}

export async function setAdminSession() {
  const token = await expectedToken();
  if (!token) throw new Error("ADMIN_PASSWORD is not configured");
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearAdminSession() {
  (await cookies()).set(COOKIE_NAME, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}
