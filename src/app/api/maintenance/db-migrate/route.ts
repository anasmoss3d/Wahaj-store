import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// One-off, token-guarded endpoint that applies the optional-cart-color
// migration on databases we cannot reach from the build machine. Removed again
// as soon as it has been used once.
const TOKEN = "wj-mig-7f3a9c2e5b1d8f4a6c0e";
const MIGRATION_NAME = "20261114220343_optional_cart_item_color";
const MIGRATION_CHECKSUM =
  "2f52c2a5c5c98dfa240d167e7173f5b5c02c10cbdb28efa2fdc4dc91e6e54ce7";

async function columnIsNullable() {
  const rows = await prisma.$queryRawUnsafe<Array<{ is_nullable: string }>>(
    `SELECT is_nullable FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'CartItem' AND column_name = 'productColorId'`
  );
  return rows[0]?.is_nullable === "YES";
}

export async function POST(request: Request) {
  if (request.headers.get("x-migrate-token") !== TOKEN) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  try {
    if (await columnIsNullable()) {
      return NextResponse.json({ ok: true, alreadyApplied: true });
    }

    await prisma.$executeRawUnsafe(
      `ALTER TABLE "CartItem" DROP CONSTRAINT IF EXISTS "CartItem_productColorId_fkey"`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "CartItem" ALTER COLUMN "productColorId" DROP NOT NULL`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productColorId_fkey"
         FOREIGN KEY ("productColorId") REFERENCES "ProductColor"("id")
         ON DELETE SET NULL ON UPDATE CASCADE`
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO "_prisma_migrations"
         ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
       SELECT gen_random_uuid()::text, '${MIGRATION_CHECKSUM}', now(), '${MIGRATION_NAME}', NULL, NULL, now(), 1
       WHERE NOT EXISTS (
         SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '${MIGRATION_NAME}'
       )`
    );

    return NextResponse.json({
      ok: true,
      applied: true,
      nullable: await columnIsNullable()
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "migration failed" },
      { status: 500 }
    );
  }
}
