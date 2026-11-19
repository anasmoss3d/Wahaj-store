import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Size catalog looked up (or created) by name. Rows created before the
  // cuid id-length rule have short manual ids, so migrate those over —
  // the admin schema rejects ids shorter than 8 characters.
  const sizeRows = new Map();
  const ensureSize = async (name, sortOrder) => {
    const existing = await prisma.size.findFirst({ where: { name, active: true } });
    if (existing && existing.id.length >= 8) return existing.id;
    if (existing) {
      let freshId;
      await prisma.$transaction(async (tx) => {
        const fresh = await tx.size.create({ data: { name, sortOrder, active: true } });
        freshId = fresh.id;
        await tx.productSize.updateMany({ where: { sizeId: existing.id }, data: { sizeId: fresh.id } });
        await tx.size.delete({ where: { id: existing.id } });
      });
      return freshId;
    }
    const created = await prisma.size.create({ data: { name, sortOrder, active: true } });
    return created.id;
  };
  for (const [name, sortOrder] of [
    ["50g", 0],
    ["100g", 1],
    ["150g", 2]
  ]) {
    sizeRows.set(name, await ensureSize(name, sortOrder));
  }

  const category = await prisma.category.findFirst();
  const existing = await prisma.product.findUnique({ where: { slug: "smoke-candle" } });
  if (existing) {
    await prisma.productSize.deleteMany({ where: { productId: existing.id } });
    await prisma.product.update({
      where: { id: existing.id },
      data: { basePrice: new Prisma.Decimal("40"), active: true }
    });
  }
  const product = await prisma.product.upsert({
    where: { slug: "smoke-candle" },
    update: { basePrice: new Prisma.Decimal("40"), active: true },
    create: {
      name: "Smoke Candle",
      slug: "smoke-candle",
      description: "Local smoke-test candle used to verify the size flow.",
      basePrice: new Prisma.Decimal("40"),
      categoryId: category.id,
      mainImage: "/seed/white-tray-set.jpg",
      sku: "SMOKE-CND-SMOKE-001",
      stockQuantity: 10,
      active: true
    }
  });
  // Re-create the product-size rows with the real cuid ids.
  await prisma.productSize.deleteMany({ where: { productId: product.id } });
  await prisma.productSize.createMany({
    data: [
      { productId: product.id, sizeId: sizeRows.get("50g"), price: new Prisma.Decimal("50"), sortOrder: 0 },
      { productId: product.id, sizeId: sizeRows.get("100g"), price: new Prisma.Decimal("80"), sortOrder: 1 },
      { productId: product.id, sizeId: sizeRows.get("150g"), price: new Prisma.Decimal("100"), sortOrder: 2 }
    ]
  });

  const rows = await prisma.productSize.findMany({
    where: { productId: product.id },
    include: { size: true },
    orderBy: { sortOrder: "asc" }
  });
  const sizeByPrice = {};
  for (const row of rows) sizeByPrice[row.size.name] = row.id;
  console.log(
    JSON.stringify({ productId: product.id, sizes: sizeByPrice })
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
