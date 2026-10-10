import { headers } from "next/headers";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export async function assertSameOrigin(method = "POST") {
  if (SAFE_METHODS.has(method.toUpperCase())) return;

  const headerStore = await headers();
  const origin = headerStore.get("origin");
  const host = headerStore.get("host");

  if (!origin || !host) {
    throw new Error("Missing origin headers.");
  }

  const originHost = new URL(origin).host;
  if (originHost !== host) {
    throw new Error("Invalid request origin.");
  }
}

export async function requestMetadata() {
  const headerStore = await headers();
  return {
    ip:
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headerStore.get("x-real-ip") ||
      null,
    userAgent: headerStore.get("user-agent") || null
  };
}

const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const current = hits.get(key);
  if (!current || current.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  current.count += 1;
  if (current.count > limit) {
    throw new Error("Too many requests. Please try again shortly.");
  }
}
