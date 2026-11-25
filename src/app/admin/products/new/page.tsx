import { AdminShell } from "@/components/admin/admin-shell";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAdminDictionary, getLocale } from "@/lib/i18n";
import { PERMISSIONS } from "@/lib/rbac";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireAdmin(PERMISSIONS.PRODUCTS_MANAGE);
  const [locale, dict, categories, colors, sizes, addons] = await Promise.all([
    getLocale(),
    getAdminDictionary(),
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    // Only active colors: selecting a muted color would make the product
    // invisible in the storefront, so it cannot be picked in the first place.
    prisma.color.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    }),
    prisma.size.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    }),
    prisma.addon.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    })
  ]);
  const isArabic = locale === "ar";

  return (
    <AdminShell>
      <div>
        <p
          className={cn(
            "text-[11px] text-[#8C7A6B] font-medium mb-1",
            !isArabic && "uppercase tracking-[0.2em]"
          )}
        >
          {dict.products.newPage.kicker}
        </p>
        <h1 className="font-editorial text-3xl sm:text-4xl font-black text-[#1C1917]">
          {dict.products.newPage.title}
        </h1>
        <p className="mt-2 text-sm text-[#665E57] font-light">
          {dict.products.newPage.subtitle}
        </p>
      </div>
      <div className="mt-8">
        <ProductForm
          addons={addons.map((addon) => ({
            id: addon.id,
            name: addon.name,
            nameEn: addon.nameEn,
            price: addon.price.toString()
          }))}
          categories={categories.map((category) => ({
            id: category.id,
            name: category.name,
            nameEn: category.nameEn
          }))}
          colors={colors.map((color) => ({
            id: color.id,
            name: color.name,
            nameEn: color.nameEn,
            hexCode: color.hexCode
          }))}
          sizes={sizes.map((size) => ({ id: size.id, name: size.name, nameEn: size.nameEn }))}
        />
      </div>
    </AdminShell>
  );
}
