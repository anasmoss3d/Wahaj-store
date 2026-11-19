import { AdminShell } from "@/components/admin/admin-shell";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireAdmin(PERMISSIONS.PRODUCTS_MANAGE);
  const [categories, colors, sizes, addons] = await Promise.all([
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    // Only active colors: selecting a muted color would make the product
    // invisible in the storefront, so it cannot be picked in the first place.
    prisma.color.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.size.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.addon.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] })
  ]);

  return (
    <AdminShell>
      <h1 className="text-3xl font-bold text-concrete-900">New product</h1>
      <p className="mt-2 text-concrete-600">Create a product without touching code.</p>
      <div className="mt-8">
        <ProductForm
          addons={addons.map((addon) => ({
            id: addon.id,
            name: addon.name,
            price: addon.price.toString()
          }))}
          categories={categories.map((category) => ({ id: category.id, name: category.name }))}
          colors={colors.map((color) => ({
            id: color.id,
            name: color.name,
            hexCode: color.hexCode
          }))}
          sizes={sizes.map((size) => ({ id: size.id, name: size.name }))}
        />
      </div>
    </AdminShell>
  );
}
