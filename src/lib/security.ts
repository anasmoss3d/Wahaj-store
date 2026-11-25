import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const HOST_PATTERN = /^(?:[a-z0-9.-]+|\[[0-9a-f:]+\])(:\d+)?$/i;
const CONTROL_CHAR_PATTERN = /[\x00-\x1f\x7f]/;

export async function assertSameOrigin(method = "POST") {
  if (SAFE_METHODS.has(method.toUpperCase())) return;

  const headerStore = await headers();
  const origin = headerStore.get("origin");
  const host = headerStore.get("host");
  const forwardedHost = headerStore.get("x-forwarded-host");
  const forwardedProto = headerStore.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();

  if (!origin || !host) {
    throw new AppError("Missing origin headers.");
  }

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    throw new AppError("Invalid request origin.");
  }

  const rawExpectedHost = forwardedHost?.split(",")[0]?.trim() || host.trim();
  if (!rawExpectedHost || !HOST_PATTERN.test(rawExpectedHost)) {
    throw new AppError("Invalid request host.");
  }

  if (originUrl.host.toLowerCase() !== rawExpectedHost.toLowerCase()) {
    throw new AppError("Invalid request origin.");
  }

  const isLocalHost =
    rawExpectedHost.startsWith("localhost") ||
    rawExpectedHost.startsWith("127.0.0.1") ||
    rawExpectedHost.startsWith("[::1]");

  if (
    forwardedProto === "https" ||
    (process.env.NODE_ENV === "production" && !isLocalHost && process.env.APP_URL?.startsWith("https://"))
  ) {
    if (originUrl.protocol !== "https:") {
      throw new AppError("Invalid request origin.");
    }
  }
}

export async function requestMetadata() {
  const headerStore = await headers();
  return {
    ip:
      headerStore.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
      headerStore.get("x-real-ip")?.trim() ||
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      null,
    userAgent: headerStore.get("user-agent") || null
  };
}

const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  if (hits.size > 500) {
    for (const [entryKey, entry] of hits) {
      if (entry.resetAt < now) hits.delete(entryKey);
    }
  }
  const current = hits.get(key);
  if (!current || current.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  current.count += 1;
  if (current.count > limit) {
    throw new AppError("Too many requests. Please try again shortly.");
  }
}

export async function rateLimitAuth(key: string, limit: number, windowMs: number) {
  const rows = await prisma.$queryRaw<Array<{ count: number }>>`
    INSERT INTO "RateLimitBucket" ("key", "count", "resetAt")
    VALUES (${key}, 1, (NOW() AT TIME ZONE 'UTC') + (${windowMs}::bigint * interval '1 millisecond'))
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimitBucket"."resetAt" <= (NOW() AT TIME ZONE 'UTC') THEN 1
        ELSE "RateLimitBucket"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "RateLimitBucket"."resetAt" <= (NOW() AT TIME ZONE 'UTC') THEN (NOW() AT TIME ZONE 'UTC') + (${windowMs}::bigint * interval '1 millisecond')
        ELSE "RateLimitBucket"."resetAt"
      END
    RETURNING "count"
  `;

  if (Math.random() < 0.02) {
    await prisma.$executeRaw`
      DELETE FROM "RateLimitBucket" WHERE "resetAt" < (NOW() AT TIME ZONE 'UTC') - interval '1 day'
    `.catch(() => {});
  }

  if ((rows[0]?.count ?? 0) > limit) {
    throw new AppError("Too many requests. Please try again shortly.");
  }
}

function parseSafeRelativeUrl(rawNext: unknown): URL | null {
  if (typeof rawNext !== "string") return null;
  const trimmed = rawNext.trim();
  if (!trimmed || trimmed.length > 512) return null;
  if (CONTROL_CHAR_PATTERN.test(trimmed)) return null;
  if (
    trimmed.includes("\\") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/@") ||
    !trimmed.startsWith("/")
  ) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed, "https://wahaj.internal");
  } catch {
    return null;
  }

  if (parsed.origin !== "https://wahaj.internal") return null;
  if (parsed.username !== "" || parsed.password !== "") return null;
  if (!parsed.pathname.startsWith("/") || parsed.pathname.startsWith("//")) return null;

  return parsed;
}

export function sanitizeNextQueryParam(rawNext: unknown): string | null {
  const parsed = parseSafeRelativeUrl(rawNext);
  if (!parsed) return null;
  if (parsed.pathname === "/admin/login" || parsed.pathname.startsWith("/auth")) {
    return null;
  }
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

export function sanitizeNextPath(
  rawNext: unknown,
  options: { role: "admin" | "customer" }
): string {
  const fallback = options.role === "admin" ? "/admin" : "/account";
  const parsed = parseSafeRelativeUrl(rawNext);
  if (!parsed) return fallback;

  const { pathname, search, hash } = parsed;
  if (options.role === "admin") {
    const isAllowedAdminPath =
      pathname === "/admin" ||
      (pathname.startsWith("/admin/") && pathname !== "/admin/login");
    return isAllowedAdminPath ? `${pathname}${search}${hash}` : fallback;
  }

  if (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/auth")
  ) {
    return fallback;
  }

  return `${pathname}${search}${hash}`;
}
