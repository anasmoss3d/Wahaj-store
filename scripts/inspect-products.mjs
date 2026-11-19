import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const products = await prisma.product.findMany({
  select: { name: true, slug: true, sku: true, active: true },
  orderBy: { sortOrder: "asc" }
});
for (const p of products) {
  console.log(`${p.name}  |  slug=${p.slug}  |  sku=${p.sku}  |  active=${p.active}`);
}
await prisma.$disconnect();
