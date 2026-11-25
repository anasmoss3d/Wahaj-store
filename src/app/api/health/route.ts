import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { describeDatabaseTarget } from "@/lib/db-url";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function classifyInitError(message: string): string {
  if (/environment variable not found/i.test(message)) return "missing_env";
  if (/authentication failed|password/i.test(message)) return "auth_failed";
  if (/can't reach database server|timed out|enotfound|econnrefused|network/i.test(message)) {
    return "unreachable";
  }
  if (/ssl|tls|certificate/i.test(message)) return "tls_error";
  if (/maxclients|too many clients|pool/i.test(message)) return "pool_exhausted";
  return "init_error";
}

function classifyDbError(error: unknown): { code: string | null; reason: string; hint: string } {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021" || error.code === "P2022") {
      return {
        code: error.code,
        reason: "schema_drift",
        hint: "Database schema is behind migrations. Run prisma migrate deploy against DIRECT_URL (use Supabase IPv4 session pooler port 5432 on Vercel)."
      };
    }
    return {
      code: error.code,
      reason: "query_error",
      hint: "Prisma query failed against Postgres."
    };
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return {
      code: error.errorCode ?? "INIT_ERROR",
      reason: classifyInitError(error.message),
      hint: "Cannot connect to Postgres. Verify DATABASE_URL is configured for this environment and uses an IPv4-reachable endpoint."
    };
  }

  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("prepared statement")) {
    return {
      code: "PGBOUNCER_PREPARED_STATEMENT",
      reason: "prepared_statement",
      hint: "Transaction pooler prepared-statement conflict. Ensure ?pgbouncer=true is enabled on DATABASE_URL."
    };
  }

  return {
    code: null,
    reason: "unknown",
    hint: "Unexpected database error."
  };
}

export async function GET() {
  const target = describeDatabaseTarget(process.env.DATABASE_URL);
  const directConfigured = Boolean(process.env.DIRECT_URL?.trim());
  const vercelEnv = process.env.VERCEL_ENV ?? null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    await Promise.all([
      prisma.category.findFirst({ select: { id: true, nameEn: true } }),
      prisma.rateLimitBucket.findFirst({ select: { key: true } })
    ]);

    return NextResponse.json({
      ok: true,
      database: "connected",
      schema: "ready",
      vercelEnv,
      directConfigured,
      ...target
    });
  } catch (error) {
    const info = classifyDbError(error);
    return NextResponse.json(
      {
        ok: false,
        database: "error",
        code: info.code,
        reason: info.reason,
        hint: info.hint,
        vercelEnv,
        directConfigured,
        ...target
      },
      { status: 503 }
    );
  }
}
