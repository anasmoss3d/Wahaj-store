import { execSync } from "node:child_process";

const BASE = "http://localhost:3100";
const out = execSync("node scripts/smoke-admin-token.mjs", { encoding: "utf8" }).trim();
const [token, adminId, role] = out.split("|");
console.log(`admin session for ${adminId} (role: ${role})`);

let failed = 0;
function check(label, ok, extra = "") {
  console.log(`${ok ? "PASS" : "FAIL"} - ${label}${extra ? " :: " + String(extra).slice(0, 200) : ""}`);
  if (!ok) failed += 1;
  return ok;
}

const headers = { cookie: `wahaj_admin_session=${token}` };

let res = await fetch(`${BASE}/admin/sizes`, { headers });
check("GET /admin/sizes 200", res.status === 200, res.status);
const sizesHtml = await res.text();
check("sizes page lists 50g/100g/150g catalog", ["50g", "100g", "150g"].every((g) => sizesHtml.includes(g)));
check("sizes page offers create form", sizesHtml.includes("Create size"));

res = await fetch(`${BASE}/admin/products/new`, { headers });
check("GET /admin/products/new 200", res.status === 200, res.status);
const newHtml = await res.text();
check("new product form includes Sizes step", newHtml.includes("Sizes"));

res = await fetch(`${BASE}/admin`, { headers });
check("GET /admin overview 200", res.status === 200, res.status);
const navHtml = await res.text();
check("admin nav includes Sizes link", navHtml.includes("/admin/sizes"));

const productId = "cmwo55u5t0001mey8ptev8d6k";
res = await fetch(`${BASE}/admin/products/${productId}`, { headers });
check(`GET /admin/products/${productId} 200`, res.status === 200, res.status);
const editHtml = await res.text();
check("edit form renders selected sizes (50g/100g/150g)", ["50g", "100g", "150g"].every((g) => editHtml.includes(g)));

process.exit(failed === 0 ? 0 : 1);
