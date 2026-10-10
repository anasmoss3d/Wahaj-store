import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

export const CUSTOMER_SESSION_COOKIE = "wahaj_customer_session";
export const ADMIN_SESSION_COOKIE = "wahaj_admin_session";
export const CART_COOKIE = "wahaj_cart_session";

const production = process.env.NODE_ENV === "production";
const month = 60 * 60 * 24 * 30;
const week = 60 * 60 * 24 * 7;

export function createToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function setSessionCookie(name: string, token: string, maxAge = week) {
  const cookieStore = await cookies();
  cookieStore.set(name, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: production,
    maxAge,
    path: "/"
  });
}

export async function clearSessionCookie(name: string) {
  const cookieStore = await cookies();
  cookieStore.delete(name);
}

export async function readCookie(name: string) {
  const cookieStore = await cookies();
  return cookieStore.get(name)?.value ?? null;
}

export async function getOrCreateCartSessionId() {
  const cookieStore = await cookies();
  const existing = cookieStore.get(CART_COOKIE)?.value;
  if (existing) return existing;

  const token = createToken();
  cookieStore.set(CART_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: production,
    maxAge: month,
    path: "/"
  });
  return token;
}
