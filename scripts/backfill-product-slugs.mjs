/**
 * One-off: replaces empty / non-ASCII product slugs with safe ASCII slugs
 * derived from the (ASCII) SKU, or the product id as a last resort.
 *
 * Usage (production credentials via env, never hardcoded):
 *   set DATABASE_URL=...
 *   set DIRECT_URL=...
 *   node scripts/backfill-product-slugs.mjs
 *
 * Dry run by default. Pass --apply to actually write.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function asciiSlug(input) {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

const isSafeAsciiSlug = (value) => /^[a-z0-9][a-z0-9-]*$/.test(value);

async function main() {
  const apply = process.argv.includes("--apply");
  const products = await prisma.product.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });

  const planned = [];
  for (const product of products) {
    if (product.slug && isSafeAsciiSlug(product.slug)) continue;

    let base = asciiSlug(product.name) || asciiSlug(product.sku) || `product-${product.id}`;
    let slug = base;
    let suffix = 2;
    while (
      (await prisma.product.findFirst({
        where: { slug, id: { not: product.id } },
        select: { id: true }
      })) !== null
    ) {
      slug = `${base}-${suffix++}`;
    }

    // Remember used slugs so several backfilled products don't collide.
    const collides = planned.some((row) => row.newSlug === slug && row.id !== product.id);
    if (collides) {
      slug = `${base}-${planned.length + 2}`;
    }
    planned.push({ id: product.id, old: product.slug, newSlug: slug });
  }

  if (planned.length === 0) {
    console.log("All slugs are already safe ASCII. Nothing to do.");
    return;
  }

  console.log(apply ? "Applying:" : "Dry run — would update:");
  for (const row of planned) {
    console.log(`  ${row.id}: ${JSON.stringify(row.old)} -> ${JSON.stringify(row.newSlug)}`);
  }

  if (apply) {
    for (const row of planned) {
      await prisma.product.update({ where: { id: row.id }, data: { slug: row.newSlug } });
    }
    console.log(`Updated ${planned.length} product(s).`);
    console.log("Remember: old links now 404. If a slug was shared externally, add a redirect.");
  } else {
    console.log("Re-run with --apply to write.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
