/**
 * End-to-end check that products without colors work start to finish.
 *
 * Requires: embedded Postgres running, `npm run db:seed` applied, and a
 * production build served on :3000 (`npm run start`).
 *
 *   node scripts/e2e-no-color.mjs
 */
import { createHash, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const BASE = "http://localhost:3000";
const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

function check(name, condition, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`  ok   ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function request(path, { method = "GET", json, cookie = "", origin = true } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
      ...(origin ? { origin: BASE } : {})
    },
    body: json ? JSON.stringify(json) : undefined,
    redirect: "manual"
  });
  const text = await response.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  const setCookie = response.headers.getSetCookie?.() ?? [];
  return { status: response.status, body, text, setCookie };
}

function findCookie(setCookie, name) {
  const hit = setCookie.find((value) => value.startsWith(`${name}=`));
  return hit ? hit.split(";")[0] : null;
}

async function main() {
  // --- admin session --------------------------------------------------------
  const adminUser = await prisma.adminUser.findFirst({ where: { active: true } });
  if (!adminUser) throw new Error("No admin user. Run `npm run db:seed` first.");

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  for (const session of await prisma.adminSession.findMany({
    where: { adminUserId: adminUser.id, expiresAt: { gt: new Date() } }
  })) {
    await prisma.adminSession.delete({ where: { id: session.id } });
  }
  await prisma.adminSession.create({
    data: {
      tokenHash,
      adminUserId: adminUser.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
    }
  });
  const adminCookie = `wahaj_admin_session=${token}`;
  console.log("admin session ready");

  // --- seed fixtures ----------------------------------------------------------
  const category = await prisma.category.findFirst();
  let inactive = await prisma.color.findFirst({ where: { active: false } });
  if (!inactive) {
    const candidate = await prisma.color.findFirst({ orderBy: { sortOrder: "desc" } });
    if (candidate) {
      await prisma.color.update({ where: { id: candidate.id }, data: { active: false } });
      inactive = await prisma.color.findFirst({ where: { active: false } });
    }
  }
  const activeColor = await prisma.color.findFirst({
    where: { active: true },
    orderBy: { sortOrder: "asc" }
  });

  // --- 1. admin creates a no-color product ------------------------------------
  const sku = "e2e-no-color-" + Date.now();
  const createRes = await request("/api/admin/products", {
    method: "POST",
    cookie: adminCookie,
    json: {
      name: "شمعة اختبار بدون لون",
      description: "E2E product with no colors and no addons.",
      basePrice: "250",
      categoryId: category.id,
      mainImage: "/seed/white-tray-set.jpg",
      sku,
      stockQuantity: 5,
      active: true,
      featured: false,
      bestSeller: false,
      sortOrder: 99,
      seoTitle: "",
      metaDescription: "",
      canonicalUrl: "",
      gallery: [],
      colors: [],
      addonIds: []
    }
  });
  check(
    "admin can create a no-color product (Arabic name, empty slug)",
    createRes.status === 200 && createRes.body.ok === true,
    JSON.stringify(createRes.body)
  );

  const created = await prisma.product.findFirst({ where: { sku }, include: { colors: true } });
  check(
    "product persisted with zero color rows",
    Boolean(created) && created.colors.length === 0
  );
  check(
    "server generated an ASCII slug from the SKU",
    created !== null && /^[a-z0-9][a-z0-9-]*$/.test(created.slug),
    created?.slug ?? "missing"
  );

  // --- 2. storefront page returns 200 (the original bug) ----------------------
  const pageRes = await request(`/products/${created.slug}`, { origin: false });
  check(
    `storefront /products/${created.slug} → 200`,
    pageRes.status === 200 && pageRes.text.includes("E2E product with no colors"),
    String(pageRes.status)
  );
  check(
    "page shows the single-version note, not a color picker",
    // Labels are also serialized into the RSC payload, so look for rendered headings.
    pageRes.text.includes("متوفرة بنسخة واحدة") &&
      !pageRes.text.includes(">اختر اللون<") &&
      !pageRes.text.includes(">أضف لمسات<")
  );

  // --- 3. add to cart without a color ----------------------------------------
  const cartRes = await request("/api/cart/items", {
    method: "POST",
    json: { productId: created.id, productColorId: null, productAddonIds: [], quantity: 2 }
  });
  check(
    "cart accepts productColorId: null for a no-color product",
    cartRes.status === 200,
    JSON.stringify(cartRes.body)
  );
  const cartItem = await prisma.cartItem.findFirst({
    where: { productId: created.id },
    include: { productColor: true }
  });
  check(
    "cart row stored with productColorId = null",
    Boolean(cartItem) && cartItem.productColorId === null
  );

  const cartCookie = findCookie(cartRes.setCookie, "wahaj_cart_session");
  check("cart API set a cart session cookie", Boolean(cartCookie));
  const cartPage = await request("/cart", { cookie: cartCookie ?? "", origin: false });
  check(
    "/cart renders the no-color line without crashing",
    cartPage.status === 200 && cartPage.text.includes("شمعة اختبار بدون لون"),
    String(cartPage.status)
  );

  // --- 4. colored product still requires a color --------------------------------
  const coloredSku = "e2e-colored-" + Date.now();
  const coloredCreate = await request("/api/admin/products", {
    method: "POST",
    cookie: adminCookie,
    json: {
      name: "E2E Colored Vase",
      description: "E2E colored product.",
      basePrice: "100",
      categoryId: category.id,
      mainImage: "/seed/white-tray-set.jpg",
      sku: coloredSku,
      stockQuantity: 3,
      active: true,
      featured: false,
      bestSeller: false,
      sortOrder: 98,
      seoTitle: "",
      metaDescription: "",
      canonicalUrl: "",
      gallery: [],
      colors: [
        {
          colorId: activeColor.id,
          additionalPrice: "0",
          imageUrl: "/seed/white-tray-set.jpg",
          active: true,
          sortOrder: 0
        }
      ],
      addonIds: []
    }
  });
  check("colored product saves fine", coloredCreate.status === 200 && coloredCreate.body.ok === true);
  const colored = await prisma.product.findUnique({ where: { sku: coloredSku } });
  const coloredOption = await prisma.productColor.findFirst({
    where: { productId: colored.id }
  });
  check(
    "colored product slug derived from ASCII name",
    colored?.slug === "e2e-colored-vase",
    colored?.slug
  );
  const coloredPage = await request(`/products/${colored.slug}`, { origin: false });
  check(
    "colored product page still shows the color picker",
    coloredPage.status === 200 && coloredPage.text.includes(">اختر اللون<")
  );

  const coloredCart = await request("/api/cart/items", {
    method: "POST",
    json: {
      productId: colored.id,
      productColorId: coloredOption.id,
      productAddonIds: [],
      quantity: 1
    }
  });
  check("colored add-to-cart still works", coloredCart.status === 200, JSON.stringify(coloredCart.body));

  const noColorOnColored = await request("/api/cart/items", {
    method: "POST",
    json: { productId: colored.id, productColorId: null, productAddonIds: [], quantity: 1 }
  });
  check(
    "colorless add-to-cart on a product WITH colors is rejected",
    noColorOnColored.status === 400 &&
      typeof noColorOnColored.body.message === "string" &&
      /color/i.test(noColorOnColored.body.message),
    JSON.stringify(noColorOnColored.body)
  );

  // --- 5. inactive colors are blocked at the API --------------------------------
  if (inactive) {
    const inactiveRes = await request("/api/admin/products", {
      method: "POST",
      cookie: adminCookie,
      json: {
        name: "E2E Inactive Color",
        description: "Product that references a muted color.",
        basePrice: "100",
        categoryId: category.id,
        mainImage: "/seed/white-tray-set.jpg",
        sku: "e2e-inactive-" + Date.now(),
        stockQuantity: 1,
        active: true,
        featured: false,
        bestSeller: false,
        sortOrder: 97,
        seoTitle: "",
        metaDescription: "",
        canonicalUrl: "",
        gallery: [],
        colors: [
          {
            colorId: inactive.id,
            additionalPrice: "0",
            imageUrl: "/seed/white-tray-set.jpg",
            active: true,
            sortOrder: 0
          }
        ],
        addonIds: []
      }
    });
    check(
      "saving a product with an inactive color is rejected with a clear message",
      inactiveRes.status === 400 &&
        typeof inactiveRes.body.message === "string" &&
        /inactive/i.test(inactiveRes.body.message),
      JSON.stringify(inactiveRes.body)
    );
  }

  // --- 6. duplicate slug / SKU is friendly ---------------------------------------
  const dup = await request("/api/admin/products", {
    method: "POST",
    cookie: adminCookie,
    json: {
      name: "Duplicate S",
      description: "Product that reuses an existing SKU.",
      basePrice: "100",
      categoryId: category.id,
      mainImage: "/seed/white-tray-set.jpg",
      sku,
      stockQuantity: 1,
      active: true,
      featured: false,
      bestSeller: false,
      sortOrder: 96,
      seoTitle: "",
      metaDescription: "",
      canonicalUrl: "",
      gallery: [],
      colors: [],
      addonIds: []
    }
  });
  check(
    "duplicate SKU produces a friendly 400 (no raw P2002)",
    dup.status === 400 &&
      typeof dup.body.message === "string" &&
      dup.body.message.includes("already in use"),
    JSON.stringify(dup.body)
  );

  // --- 7. PUT keeps an unchanged slug and re-derives a cleared one ---------------
  const putRes = await request(`/api/admin/products/${colored.id}`, {
    method: "PUT",
    cookie: adminCookie,
    json: {
      name: "E2E Colored Vase v2",
      description: "E2E colored product.",
      basePrice: "100",
      categoryId: category.id,
      mainImage: "/seed/white-tray-set.jpg",
      sku: coloredSku,
      slug: colored.slug,
      stockQuantity: 3,
      active: true,
      featured: false,
      bestSeller: false,
      sortOrder: 98,
      seoTitle: "",
      metaDescription: "",
      canonicalUrl: "",
      gallery: [],
      colors: [
        {
          colorId: activeColor.id,
          additionalPrice: "0",
          imageUrl: "/seed/white-tray-set.jpg",
          active: true,
          sortOrder: 0
        }
      ],
      addonIds: []
    }
  });
  check("PUT with unchanged slug keeps it", putRes.status === 200 && putRes.body.ok === true);
  const afterPut = await prisma.product.findUnique({ where: { id: colored.id } });
  check(
    "slug after PUT is unchanged (no accidental -2 suffix)",
    afterPut.slug === colored.slug,
    `${colored.slug} -> ${afterPut.slug}`
  );

  // A cleared slug on PUT gets re-derived (and unique-suffixed against itself).
  const putCleared = await request(`/api/admin/products/${colored.id}`, {
    method: "PUT",
    cookie: adminCookie,
    json: {
      name: "E2E Colored Vase v3",
      description: "E2E colored product.",
      basePrice: "100",
      categoryId: category.id,
      mainImage: "/seed/white-tray-set.jpg",
      sku: coloredSku,
      slug: "",
      stockQuantity: 3,
      active: true,
      featured: false,
      bestSeller: false,
      sortOrder: 98,
      seoTitle: "",
      metaDescription: "",
      canonicalUrl: "",
      gallery: [],
      colors: [
        {
          colorId: activeColor.id,
          additionalPrice: "0",
          imageUrl: "/seed/white-tray-set.jpg",
          active: true,
          sortOrder: 0
        }
      ],
      addonIds: []
    }
  });
  const afterCleared = await prisma.product.findUnique({ where: { id: colored.id } });
  check(
    "PUT with a cleared slug re-derives and keeps it unique for the same product",
    putCleared.status === 200 &&
      afterCleared.slug === "e2e-colored-vase" &&
      afterCleared.slug !== `${colored.slug}-2`,
    `${colored.slug} -> ${afterCleared.slug}`
  );

  // --- cleanup --------------------------------------------------------------------
  await prisma.cartItemAddon.deleteMany({
    where: { cartItem: { productId: { in: [created.id, colored.id] } } }
  });
  await prisma.cartItem.deleteMany({ where: { productId: { in: [created.id, colored.id] } } });
  await prisma.product.deleteMany({ where: { id: { in: [created.id, colored.id] } } });
  if (inactive) {
    await prisma.color.update({ where: { id: inactive.id }, data: { active: true } });
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exitCode = failed === 0 ? 0 : 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
