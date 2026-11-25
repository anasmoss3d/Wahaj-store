import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { normalizeDatabaseUrl } from "@/lib/db-url";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function classifyDbError(error: unknown): { code: string | null; hint: string } {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021" || error.code === "P2022") {
      return {
        code: error.code,
        hint: "Database schema is behind migrations. Run prisma migrate deploy against DIRECT_URL (use Supabase IPv4 session pooler port 5432 on Vercel)."
      };
    }
    return {
      code: error.code,
      hint: "Prisma query failed against Postgres."
    };
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return {
      code: error.errorCode ?? "INIT_ERROR",
      hint: "Cannot connect to Postgres. Check DATABASE_URL pooling params (?pgbouncer=true on port 6543) and verify the database server is reachable."
    };
  }

  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("prepared statement")) {
    return {
      code: "PGBOUNCER_PREPARED_STATEMENT",
      hint: "Transaction pooler prepared-statement conflict. Ensure ?pgbouncer=true is enabled on DATABASE_URL."
    };
  }

  return {
    code: null,
    hint: "Unexpected database error."
  };
}

export async function GET() {
  const normalizedUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);
  const pgbouncerMode = normalizedUrl?.includes("pgbouncer=true") ?? false;

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
      pgbouncerMode
    });
  } catch (error) {
    const info = classifyDbError(error);
    return NextResponse.json(
      {
        ok: false,
        database: "error",
        code: info.code,
        hint: info.hint,
        pgbouncerMode
      },
      { status: 503 }
    );
  }
}
