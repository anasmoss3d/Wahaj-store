import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/rbac";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function EditProductPage({ params }: { params: Params }) {
  await requireAdmin(PERMISSIONS.PRODUCTS_MANAGE);
  const { id } = await params;
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
    prisma.color.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.size.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.addon.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] })
  ]);

  if (!product) notFound();

  return (
    <AdminShell>
      <h1 className="text-3xl font-bold text-concrete-900">Edit product</h1>
      <p className="mt-2 text-concrete-600">{product.name}</p>
      <div className="mt-4">
        <DeleteProductButton id={product.id} name={product.name} />
      </div>
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
          initial={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
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
            metaDescription: product.metaDescription ?? "",
            canonicalUrl: product.canonicalUrl ?? "",
            gallery: product.images.map((image) => ({
              url: image.url,
              alt: image.alt ?? "",
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
