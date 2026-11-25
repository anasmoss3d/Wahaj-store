import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pickLocalized } from "@/lib/dictionary";
import { getAdminDictionary, getLocale } from "@/lib/i18n";
import { PERMISSIONS } from "@/lib/rbac";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function EditProductPage({ params }: { params: Params }) {
  await requireAdmin(PERMISSIONS.PRODUCTS_MANAGE);
  const [{ id }, locale, dict] = await Promise.all([
    params,
    getLocale(),
    getAdminDictionary()
  ]);
  const isArabic = locale === "ar";

  const [product, categories, colors, sizes, addons] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        colors: { orderBy: { sortOrder: "asc" } },
        sizes: { orderBy: { sortOrder: "asc" } },
        addons: true
      }
    }),
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    // Only active colors are shown (a muted color would vanish from the
    // storefront). A product that already holds a muted color can still be
    // opened; saving without selecting it drops that hidden option.
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

  if (!product) notFound();
  const displayName = pickLocalized(locale, product.name, product.nameEn);

  return (
    <AdminShell>
      <div>
        <p
          className={cn(
            "text-[11px] text-[#8C7A6B] font-medium mb-1",
            !isArabic && "uppercase tracking-[0.2em]"
          )}
        >
          {dict.products.editPage.kicker}
        </p>
        <h1 className="font-editorial text-3xl sm:text-4xl font-black text-[#1C1917]">
          {dict.products.editPage.title}
        </h1>
        <p className="mt-2 text-sm text-[#665E57] font-light">
          {product.name}
          {product.nameEn ? ` · ${product.nameEn}` : ""}
        </p>
      </div>
      <div className="mt-4">
        <DeleteProductButton id={product.id} name={displayName} />
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
          initial={{
            id: product.id,
            name: product.name,
            nameEn: product.nameEn ?? "",
            slug: product.slug,
            description: product.description,
            descriptionEn: product.descriptionEn ?? "",
            basePrice: product.basePrice.toString(),
            categoryId: product.categoryId,
            mainImage: product.mainImage,
            sku: product.sku,
            stockQuantity: product.stockQuantity,
            active: product.active,
            featured: product.featured,
            bestSeller: product.bestSeller,
            sortOrder: product.sortOrder,
            seoTitle: product.seoTitle ?? "",
            seoTitleEn: product.seoTitleEn ?? "",
            metaDescription: product.metaDescription ?? "",
            metaDescriptionEn: product.metaDescriptionEn ?? "",
            canonicalUrl: product.canonicalUrl ?? "",
            gallery: product.images.map((image) => ({
              url: image.url,
              alt: image.alt ?? "",
              altEn: image.altEn ?? "",
              sortOrder: image.sortOrder
            })),
            colors: product.colors.map((color) => ({
              colorId: color.colorId,
              additionalPrice: color.additionalPrice.toString(),
              imageUrl: color.imageUrl,
              active: color.active,
              sortOrder: color.sortOrder
            })),
            sizes: product.sizes.map((size) => ({
              sizeId: size.sizeId,
              price: size.price.toString(),
              active: size.active,
              sortOrder: size.sortOrder
            })),
            addonIds: product.addons.map((addon) => addon.addonId)
          }}
        />
      </div>
    </AdminShell>
  );
}
