import { spawnSync } from "node:child_process";

const isVercel = process.env.VERCEL === "1";

function deriveSupabaseSessionPoolerUrl(rawUrl) {
  const trimmed = rawUrl?.trim();
  if (!trimmed) return undefined;
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    if (
      (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") ||
      !host.endsWith(".pooler.supabase.com")
    ) {
      return undefined;
    }
    parsed.port = "5432";
    parsed.searchParams.delete("pgbouncer");
    parsed.searchParams.delete("connection_limit");
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function runCommand(command, args, options = {}) {
  const useShell = process.platform === "win32";
  return spawnSync(command, args, {
    env: options.env ?? process.env,
    stdio: options.capture ? "pipe" : "inherit",
    encoding: options.capture ? "utf8" : undefined,
    timeout: options.timeoutMs,
    shell: useShell
  });
}

function runRequired(command, args) {
  const result = runCommand(command, args);
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runVercelMigrations() {
  if (!isVercel || !process.env.DATABASE_URL?.trim()) {
    return;
  }

  const sessionPoolerUrl = deriveSupabaseSessionPoolerUrl(process.env.DATABASE_URL);
  const configuredDirectUrl = process.env.DIRECT_URL?.trim();
  const primaryDirectUrl =
    configuredDirectUrl || sessionPoolerUrl || process.env.DATABASE_URL.trim();

  const initial = runCommand("npx", ["prisma", "migrate", "deploy"], {
    env: {
      ...process.env,
      DATABASE_URL: configuredDirectUrl ? process.env.DATABASE_URL : primaryDirectUrl,
      DIRECT_URL: primaryDirectUrl
    },
    capture: true,
    timeoutMs: 30_000
  });

  if (initial.stdout) process.stdout.write(initial.stdout);
  if (initial.stderr) process.stderr.write(initial.stderr);
  if (initial.status === 0) return;

  const combined = `${initial.stdout ?? ""}\n${initial.stderr ?? ""}\n${initial.error?.message ?? ""}`;
  const canRetryWithSessionPooler =
    Boolean(sessionPoolerUrl) &&
    sessionPoolerUrl !== primaryDirectUrl &&
    (initial.error?.code === "ETIMEDOUT" ||
      combined.includes("P1001") ||
      combined.includes("Can't reach database server") ||
      combined.includes("prepared statement") ||
      combined.includes("pg_advisory_lock"));

  if (canRetryWithSessionPooler && sessionPoolerUrl) {
    console.warn(
      "[build] Primary DIRECT_URL could not run migrations from Vercel; retrying with Supabase IPv4 session pooler (port 5432)."
    );
    const retry = runCommand("npx", ["prisma", "migrate", "deploy"], {
      env: {
        ...process.env,
        DATABASE_URL: sessionPoolerUrl,
        DIRECT_URL: sessionPoolerUrl
      },
      timeoutMs: 30_000
    });
    if (retry.status === 0) return;
  }

  console.error(
    "[build] prisma migrate deploy failed on Vercel. Set DIRECT_URL to an IPv4-reachable direct/session Postgres URL (for Supabase, use the Session pooler on port 5432, not IPv6 db.<ref>.supabase.co and not transaction port 6543)."
  );
  process.exit(initial.status ?? 1);
}

runRequired("npx", ["prisma", "generate"]);
runVercelMigrations();
runRequired("npx", ["next", "build"]);
