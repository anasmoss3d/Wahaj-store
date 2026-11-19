import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const BASE = "http://localhost:3100";
const out = execSync("node scripts/smoke-admin-token.mjs", { encoding: "utf8" }).trim();
const [token] = out.split("|");
const headers = {
  cookie: `wahaj_admin_session=${token}`,
  "content-type": "application/json",
  origin: BASE
};

let failed = 0;
function check(label, ok, extra = "") {
  console.log(`${ok ? "PASS" : "FAIL"} - ${label}${extra ? " :: " + String(extra).slice(0, 220) : ""}`);
  if (!ok) failed += 1;
  return ok;
}

const prisma = new PrismaClient();
const category = await prisma.category.findFirst();

function payload(overrides) {
  return {
    name: "E2E Smoke Tray",
    slug: "",
    description: "Smoke-test product for the auto slug/SKU flow.",
    basePrice: "250",
    categoryId: category.id,
    mainImage: "/seed/white-tray-set.jpg",
    sku: "WAH-AUTO",
    stockQuantity: 5,
    active: true,
    featured: false,
    bestSeller: false,
    sortOrder: 0,
    seoTitle: "",
    metaDescription: "",
    canonicalUrl: "",
    gallery: [],
    colors: [],
    sizes: [],
    addonIds: [],
    ...overrides
  };
}

const created = [];
async function createProduct(overrides) {
  const res = await fetch(`${BASE}/api/admin/products`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload(overrides))
  });
  const body = await res.json().catch(() => null);
  return { res, body, id: body?.productId };
}

// 1) Latin name -> auto SKU from the name + slug from the name.
let { res, body, id } = await createProduct({});
check("POST product (auto SKU) -> 200", res.status === 200, `status ${res.status} body ${JSON.stringify(body)}`);
created.push(id);
let p = await prisma.product.findUnique({ where: { id } });
check("SKU auto-generated as WAH-STEM-###", /^WAH-[A-Z0-9]+-\d{3}$/.test(p?.sku ?? ""), `sku=${p?.sku}`);
check("SKU derives from the name", p?.sku?.startsWith("WAH-TRAY") === false && p?.sku?.startsWith("WAH-E2ESMOKE") === true, `sku=${p?.sku}`);
check("slug auto-generated from the same name", p?.slug === "e2e-smoke-tray", `slug=${p?.slug}`);

// 2) Second identical name -> unique counter, unique slug suffix.
({ res, body, id } = await createProduct({}));
check("POST duplicate name -> 200", res.status === 200, `status ${res.status}`);
created.push(id);
let p2 = await prisma.product.findUnique({ where: { id } });
check("duplicate name gets a different SKU counter", p2?.sku !== p?.sku, `${p?.sku} vs ${p2?.sku}`);
check("duplicate name gets a unique slug", p2?.slug === "e2e-smoke-tray-2", `slug=${p2?.slug}`);

// 3) Arabic name -> generic stem SKU + product-<ts> slug (still resolvable, no 404 risk).
({ res, body, id } = await createProduct({ name: "شمعة عود فاخرة" }));
check("POST Arabic-name product -> 200", res.status === 200, `status ${res.status} ${JSON.stringify(body)}`);
created.push(id);
let p3 = await prisma.product.findUnique({ where: { id } });
check("Arabic name gets a generated SKU", /^WAH-[-A-Z0-9]+$/.test(p3?.sku ?? ""), `sku=${p3?.sku}`);
check("Arabic name slug is a safe fallback", /^product-\d+$/.test(p3?.slug ?? ""), `slug=${p3?.slug}`);
let arRes = await fetch(`${BASE}/products/${p3.slug}`);
check("Arabic-fallback product page is NOT 404", arRes.status === 200, `status ${arRes.status}`);

// 4) Storefront link for the Latin product resolves.
let linkRes = await fetch(`${BASE}/products/${p.slug}`);
check("auto-slug product page is 200", linkRes.status === 200, `status ${linkRes.status}`);

// 5) PUT: keep a real SKU even when the name changes (stable SKU). The slug
// is submitted unchanged, so the server keeps the saved one.
const putRes = await fetch(`${BASE}/api/admin/products/${p2.id}`, {
  method: "PUT",
  headers,
  body: JSON.stringify({ ...payload({ name: "E2E Smoke Tray 100" }), sku: p2.sku })
});
await putRes.json();
check("PUT rename keeps the existing SKU", putRes.status === 200);
let p2b = await prisma.product.findUnique({ where: { id: p2.id } });
check("SKU unchanged after rename", p2b?.sku === p2?.sku, `${p2?.sku} vs ${p2b?.sku}`);
check("unchanged slug is kept on the server", p2b?.slug === "e2e-smoke-tray-2", `slug=${p2b?.slug}`);

// 6) PUT: a stale placeholder SKU (data repair) regenerates from the new name.
await prisma.product.update({ where: { id: p.id }, data: { sku: "WAH-AUTO" } });
const put2 = await fetch(`${BASE}/api/admin/products/${p.id}`, {
  method: "PUT",
  headers,
  body: JSON.stringify(payload({ name: "E2E Smoke Tray XL" }))
});
await put2.json();
check("PUT with placeholder sku -> 200", put2.status === 200);
let p1b = await prisma.product.findUnique({ where: { id: p.id } });
check("placeholder sku regenerated from name", /^WAH-[A-Z0-9]+-\d{3}$/.test(p1b?.sku ?? ""), `sku=${p1b?.sku}`);
check("regenerated sku is not the placeholder", p1b?.sku !== "WAH-AUTO", `sku=${p1b?.sku}`);

// 7) Admin form: the SKU field is now the auto preview with the friendly hint.
const newForm = await (await fetch(`${BASE}/admin/products/new`, { headers: { cookie: `wahaj_admin_session=${token}` } })).text();
check("new-product form shows auto SKU hint", newForm.includes("Auto-generated from the product name"));

// 8) Friendly product 404 (default Arabic locale).
let nf = await fetch(`${BASE}/products/this-does-not-exist`);
const nfAr = await nf.text();
check("missing product page -> 404", nf.status === 404, `status ${nf.status}`);
check("404 page is localized (AR)", nfAr.includes("المنتج مش موجود"));
// English locale via cookie.
nf = await fetch(`${BASE}/products/this-does-not-exist`, { headers: { cookie: "wahaj_locale=en" } });
const nfEn = await nf.text();
check("404 page is localized (EN)", nf.status === 404 && nfEn.includes("Product not found"));

// Cleanup smoke products (keep smoke-candle for the size flow).
for (const pid of created) {
  if (pid) await prisma.product.deleteMany({ where: { id: pid } });
}
await prisma.$disconnect();

console.log(failed === 0 ? "ALL SKU SMOKE CHECKS PASSED" : `${failed} FAILURES`);
process.exit(failed === 0 ? 0 : 1);
