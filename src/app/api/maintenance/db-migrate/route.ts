import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// One-off, token-guarded endpoint that applies the optional product sizes
// migration on the production database we cannot reach from the build
// machine. Removed again as soon as it has been used once.
const TOKEN = "wj-sizes-a47c91e62b0d8f3b5e19";
const MIGRATION_NAME = "20261119114243_product_sizes";
const MIGRATION_CHECKSUM =
  "191652954d1a92d03253a321a5a882d7888f44c196d750b7e5854c462d5aa8da";

async function tablesExist() {
  const rows = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
    `SELECT COUNT(*) FILTER (WHERE table_name IN ('Size','ProductSize')) AS count
     FROM information_schema.tables
     WHERE table_schema = 'public'`
  );
  return Number(rows[0]?.count ?? 0) === 2;
}

export async function POST(request: Request) {
  if (request.headers.get("x-migrate-token") !== TOKEN) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  try {
    if (await tablesExist()) {
      return NextResponse.json({ ok: true, alreadyApplied: true });
    }

    await prisma.$executeRawUnsafe(
      `CREATE TABLE "Size" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Size_pkey" PRIMARY KEY ("id")
      )`
    );
    await prisma.$executeRawUnsafe(`CREATE INDEX "Size_active_sortOrder_idx" ON "Size"("active", "sortOrder")`);

    await prisma.$executeRawUnsafe(
      `CREATE TABLE "ProductSize" (
        "id" TEXT NOT NULL,
        "productId" TEXT NOT NULL,
        "sizeId" TEXT NOT NULL,
        "price" DECIMAL(10,2) NOT NULL,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        CONSTRAINT "ProductSize_pkey" PRIMARY KEY ("id")
      )`
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX "ProductSize_productId_active_sortOrder_idx" ON "ProductSize"("productId", "active", "sortOrder")`
    );
    await prisma.$executeRawUnsafe(`CREATE INDEX "ProductSize_sizeId_idx" ON "ProductSize"("sizeId")`);
    await prisma.$executeRawUnsafe(
      `CREATE UNIQUE INDEX "ProductSize_productId_sizeId_key" ON "ProductSize"("productId", "sizeId")`
    );

    await prisma.$executeRawUnsafe(`ALTER TABLE "CartItem" ADD COLUMN "productSizeId" TEXT`);
    await prisma.$executeRawUnsafe(`CREATE INDEX "CartItem_productSizeId_idx" ON "CartItem"("productSizeId")`);
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "ProductSize" ADD CONSTRAINT "ProductSize_productId_fkey"
         FOREIGN KEY ("productId") REFERENCES "Product"("id")
         ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "ProductSize" ADD CONSTRAINT "ProductSize_sizeId_fkey"
         FOREIGN KEY ("sizeId") REFERENCES "Size"("id")
         ON DELETE RESTRICT ON UPDATE CASCADE`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productSizeId_fkey"
         FOREIGN KEY ("productSizeId") REFERENCES "ProductSize"("id")
         ON DELETE SET NULL ON UPDATE CASCADE`
    );

    await prisma.$executeRawUnsafe(
      `ALTER TABLE "OrderItem" ADD COLUMN "selectedSizeName" TEXT NOT NULL DEFAULT ''`
    );

    await prisma.$executeRawUnsafe(
      `INSERT INTO "_prisma_migrations"
         ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
       SELECT gen_random_uuid()::text, '${MIGRATION_CHECKSUM}', now(), '${MIGRATION_NAME}', NULL, NULL, now(), 1
       WHERE NOT EXISTS (
         SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '${MIGRATION_NAME}'
       )`
    );

    return NextResponse.json({ ok: true, applied: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "migration failed" },
      { status: 500 }
    );
  }
}
