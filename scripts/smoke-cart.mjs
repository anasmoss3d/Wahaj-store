// Local smoke test for the size flow.
import { execSync } from "node:child_process";

const BASE = "http://localhost:3100";
const preparedLine = execSync("node scripts/smoke-prepare.mjs", { encoding: "utf8" })
  .trim()
  .split("\n")
  .map((line) => {
    try {
      JSON.parse(line);
      return line;
    } catch {
      return null;
    }
  })
  .find(Boolean);
const prepared = JSON.parse(preparedLine);
const PRODUCT_ID = prepared.productId;
const SIZE_100G = prepared.sizes["100g"];
const SIZE_150G = prepared.sizes["150g"];
const BOGUS_SIZE = "cmwo55u5z9999999999";

const jar = new Map();
function saveCookies(response) {
  const setAll = response.headers.getSetCookie?.() ?? [];
  for (const line of setAll) {
    const [pair] = line.split(";");
    const idx = pair.indexOf("=");
    jar.set(pair.slice(0, idx).trim(), pair.slice(idx + 1));
  }
}
function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

let failed = 0;
function check(label, ok, extra = "") {
  console.log(`${ok ? "PASS" : "FAIL"} - ${label}${extra ? " :: " + extra : ""}`);
  if (!ok) failed += 1;
  return ok;
}

// Warm up so any cookie-setting GET runs first.
let res = await fetch(`${BASE}/products/smoke-candle`, { headers: { cookie: cookieHeader() } });
saveCookies(res);
check("product page 200", res.status === 200);
const productHtml = await res.text();
check("product page lists 50g/100g/150g", ["50g", "100g", "150g"].every((g) => productHtml.includes(g)));
check("product page shows starts-from price (min 50)", productHtml.includes("50"));

res = await fetch(`${BASE}/api/cart/items`, {
  method: "POST",
  headers: { "content-type": "application/json", origin: BASE, cookie: cookieHeader() },
  body: JSON.stringify({ productId: PRODUCT_ID, quantity: 1 })
});
saveCookies(res);
const noSize = await res.json().catch(() => null);
check("no-size POST rejected with friendly 400", res.status === 400 && noSize?.message?.includes("size"), JSON.stringify(noSize));

res = await fetch(`${BASE}/api/cart/items`, {
  method: "POST",
  headers: { "content-type": "application/json", origin: BASE, cookie: cookieHeader() },
  body: JSON.stringify({ productId: PRODUCT_ID, productSizeId: SIZE_100G, quantity: 2 })
});
saveCookies(res);
const withSize = await res.json().catch(() => null);
check("with-size POST ok", res.status === 200 && withSize?.ok === true, JSON.stringify(withSize));

res = await fetch(`${BASE}/cart`, { headers: { cookie: cookieHeader() } });
saveCookies(res);
const cartHtml = await res.text();
check("cart page 200", res.status === 200);
check("cart shows size 100g", cartHtml.includes("100g"));
check("cart total is 2 x 80 = 160", cartHtml.includes("160"));

// An unknown size id must be rejected with a friendly error.
res = await fetch(`${BASE}/api/cart/items`, {
  method: "POST",
  headers: { "content-type": "application/json", origin: BASE, cookie: cookieHeader() },
  body: JSON.stringify({ productId: PRODUCT_ID, productSizeId: BOGUS_SIZE, quantity: 1 })
});
saveCookies(res);
const bogusSize = await res.json().catch(() => null);
check("unknown size id rejected with friendly 400", res.status === 400 && bogusSize?.message?.includes("size"), JSON.stringify(bogusSize));

// Same product, different size adds a second line (size is part of identity).
res = await fetch(`${BASE}/api/cart/items`, {
  method: "POST",
  headers: { "content-type": "application/json", origin: BASE, cookie: cookieHeader() },
  body: JSON.stringify({ productId: PRODUCT_ID, productSizeId: SIZE_150G, quantity: 1 })
});
saveCookies(res);
check("150g as second line ok", res.status === 200);

res = await fetch(`${BASE}/cart`, { headers: { cookie: cookieHeader() } });
saveCookies(res);
const cartHtml2 = await res.text();
check("cart shows both 100g and 150g lines", cartHtml2.includes("100g") && cartHtml2.includes("150g"));
check("cart total is 160 + 100 = 260", cartHtml2.includes("260"));

process.exit(failed === 0 ? 0 : 1);
