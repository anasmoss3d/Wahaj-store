const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function isPostgresUrl(url: URL): boolean {
  return url.protocol === "postgresql:" || url.protocol === "postgres:";
}

function isPooledPostgresHost(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  return (
    url.port === "6543" ||
    host.includes("pooler") ||
    host.includes("pgbouncer") ||
    host.includes("-pooler.")
  );
}

/**
 * Normalizes a Postgres connection string for serverless Prisma usage:
 * - Preserves local development URLs unchanged.
 * - Enables `pgbouncer=true` when connecting through transaction poolers
 *   (e.g. Supabase `:6543` / `*.pooler.supabase.com`, Neon `-pooler`).
 * - Bounds `connection_limit` and `connect_timeout` on remote hosts so
 *   serverless workers do not exhaust session/transaction pool slots.
 */
export function normalizeDatabaseUrl(rawUrl: string | undefined): string | undefined {
  const trimmed = rawUrl?.trim();
  if (!trimmed) return undefined;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return trimmed;
  }

  if (!isPostgresUrl(parsed) || LOCAL_HOSTS.has(parsed.hostname.toLowerCase())) {
    return trimmed;
  }

  if (isPooledPostgresHost(parsed) && !parsed.searchParams.has("pgbouncer")) {
    parsed.searchParams.set("pgbouncer", "true");
  }

  if (!parsed.searchParams.has("connection_limit")) {
    parsed.searchParams.set("connection_limit", "5");
  }

  if (!parsed.searchParams.has("connect_timeout")) {
    parsed.searchParams.set("connect_timeout", "15");
  }

  return parsed.toString();
}

export type DatabaseTargetSummary = {
  configured: boolean;
  pgbouncerMode: boolean;
  targetKind: "missing" | "localhost" | "supabase-pooler" | "supabase-direct" | "remote-pooler" | "remote-direct" | "invalid";
};

/** Non-secret summary of the normalized database URL for /api/health diagnostics. */
export function describeDatabaseTarget(rawUrl: string | undefined): DatabaseTargetSummary {
  const normalized = normalizeDatabaseUrl(rawUrl);
  if (!normalized) {
    return { configured: false, pgbouncerMode: false, targetKind: "missing" };
  }
  try {
    const parsed = new URL(normalized);
    const host = parsed.hostname.toLowerCase();
    const pgbouncerMode = parsed.searchParams.get("pgbouncer") === "true";
    if (LOCAL_HOSTS.has(host)) {
      return { configured: true, pgbouncerMode, targetKind: "localhost" };
    }
    if (host.endsWith(".pooler.supabase.com")) {
      return { configured: true, pgbouncerMode, targetKind: "supabase-pooler" };
    }
    if (host.endsWith(".supabase.co")) {
      return { configured: true, pgbouncerMode, targetKind: "supabase-direct" };
    }
    if (isPooledPostgresHost(parsed)) {
      return { configured: true, pgbouncerMode, targetKind: "remote-pooler" };
    }
    return { configured: true, pgbouncerMode, targetKind: "remote-direct" };
  } catch {
    return { configured: true, pgbouncerMode: false, targetKind: "invalid" };
  }
}

/**
 * Derives an IPv4 Supabase Session Pooler URL (port 5432, no `pgbouncer=true`)
 * from a Supabase Transaction Pooler URL (`*.pooler.supabase.com:6543`) so
 * `prisma migrate deploy` can obtain advisory locks even when Vercel cannot
 * reach IPv6-only `db.<ref>.supabase.co:5432`.
 */
export function deriveSupabaseSessionPoolerUrl(rawUrl: string | undefined): string | undefined {
  const trimmed = rawUrl?.trim();
  if (!trimmed) return undefined;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return undefined;
  }

  const host = parsed.hostname.toLowerCase();
  if (!isPostgresUrl(parsed) || !host.endsWith(".pooler.supabase.com")) {
    return undefined;
  }

  parsed.port = "5432";
  parsed.searchParams.delete("pgbouncer");
  parsed.searchParams.delete("connection_limit");
  return parsed.toString();
}
