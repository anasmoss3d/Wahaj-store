import { execSync } from "node:child_process";

const BASE = "http://localhost:3100";
const out = execSync("node scripts/smoke-admin-token.mjs", { encoding: "utf8" }).trim();
const [token] = out.split("|");
const headers = {
  cookie: `wahaj_admin_session=${token}`,
  "content-type": "application/json",
  origin: BASE
};

const productId = "cmwo55u5t0001mey8ptev8d6k";

let failed = 0;
function check(label, ok, extra = "") {
  console.log(`${ok ? "PASS" : "FAIL"} - ${label}${extra ? " :: " + String(extra).slice(0, 300) : ""}`);
  if (!ok) failed += 1;
  return ok;
}

// 1) Read the product the same way the admin page does, to build the PUT payload.
const { PrismaClient, Prisma } = await import("@prisma/client");
const prisma = new PrismaClient();
const product = await prisma.product.findUnique({
  where: { id: productId },
  include: { images: true, colors: true, sizes: { include: { size: true } }, addons: true }
});
await prisma.$disconnect();

const payload = {
  name: product.name,
  slug: product.slug,
  description: product.description,
  basePrice: product.basePrice.toString(),
  categoryId: product.categoryId,
  mainImage: product.mainImage || product.images[0]?.url || "/seed/white-tray-set.jpg",
  sku: product.sku,
  stockQuantity: product.stockQuantity,
  active: true,
  featured: product.featured,
  bestSeller: product.bestSeller,
  sortOrder: product.sortOrder,
  seoTitle: product.seoTitle ?? "",
  metaDescription: product.metaDescription ?? "",
  canonicalUrl: product.canonicalUrl ?? "",
  gallery: product.images.map((i) => ({ url: i.url, alt: i.alt, sortOrder: i.sortOrder })),
  colors: product.colors.map((c) => ({
    colorId: c.colorId,
    additionalPrice: c.additionalPrice.toString(),
    imageUrl: c.imageUrl,
    active: c.active,
    sortOrder: c.sortOrder
  })),
  sizes: product.sizes.map((s) => ({
    sizeId: s.sizeId,
    price: s.price.toString(),
    active: s.active,
    sortOrder: s.sortOrder
  })),
  addonIds: product.addons.map((a) => a.addonId)
};

// 2) Bump the 100g size price to 85, PUT, then verify it persisted.
const row100 = product.sizes.find((s) => s.size?.name === "100g");
const s100 = payload.sizes.find((s) => s.sizeId === row100?.sizeId);
const oldPrice = s100?.price;
if (s100) s100.price = "85";

let res = await fetch(`${BASE}/api/admin/products/${productId}`, { method: "PUT", headers, body: JSON.stringify(payload) });
const body = await res.json().catch(() => null);
check(`PUT product with sizes -> 200`, res.status === 200, `status ${res.status}, body ${JSON.stringify(body)?.slice(0, 120)}`);

const prisma2 = new PrismaClient();
const updated = await prisma2.product.findUnique({
  where: { id: productId },
  include: { sizes: { include: { size: true } } }
});
await prisma2.$disconnect();
const updated100 = updated.sizes.find((s) => s.sizeId === s100.sizeId);
check("100g price now 85 in DB", updated100?.price.toString() === "85", `price ${updated100?.price?.toString()}`);
check("all 3 sizes persisted", updated.sizes.length === 3, `count ${updated.sizes.length}`);

// 3) Restore the original price.
s100.price = oldPrice;
res = await fetch(`${BASE}/api/admin/products/${productId}`, { method: "PUT", headers, body: JSON.stringify(payload) });
check(`PUT restore price ${oldPrice} -> 200`, res.status === 200);
const prisma3 = new PrismaClient();
const restored = await prisma3.product.findUnique({ where: { id: productId }, include: { sizes: true } });
await prisma3.$disconnect();
check(
  "100g price restored",
  restored.sizes.find((s) => s.sizeId === s100.sizeId)?.price.toString() === oldPrice
);

process.exit(failed === 0 ? 0 : 1);
