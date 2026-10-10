import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCustomizer } from "@/components/storefront/product-customizer";
import { StorefrontFooter } from "@/components/storefront/footer";
import { StorefrontHeader } from "@/components/storefront/header";
import { prisma } from "@/lib/db";
import { productJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

async function getProduct(slug: string) {
  return prisma.product.findFirst({
    where: { slug, active: true },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      colors: {
        where: { active: true, color: { active: true } },
        include: { color: true },
        orderBy: { sortOrder: "asc" }
      },
      addons: {
        where: { active: true, addon: { active: true } },
        include: { addon: true },
        orderBy: { sortOrder: "asc" }
      }
    }
  });
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) return {};

  return {
    title: product.seoTitle || product.name,
    description: product.metaDescription || product.description.slice(0, 155),
    alternates: product.canonicalUrl ? { canonical: product.canonicalUrl } : undefined,
    openGraph: {
      title: product.seoTitle || product.name,
      description: product.metaDescription || product.description.slice(0, 155),
      images: [product.mainImage]
    }
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product || product.colors.length === 0) notFound();

  const jsonLd = productJsonLd(product);

  return (
    <>
      <StorefrontHeader />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <ProductCustomizer
          product={{
            id: product.id,
            name: product.name,
            basePrice: Number(product.basePrice)
          }}
          colors={product.colors.map((item) => ({
            id: item.id,
            name: item.color.name,
            hexCode: item.color.hexCode,
            additionalPrice: Number(item.additionalPrice),
            imageUrl: item.imageUrl
          }))}
          addons={product.addons.map((item) => ({
            id: item.id,
            name: item.addon.name,
            description: item.addon.description,
            price: Number(item.addon.price),
            imageUrl: item.addon.imageUrl
          }))}
        />
        <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold text-concrete-900">Details</h2>
            <p className="mt-3 leading-8 text-concrete-700">{product.description}</p>
          </div>
          <aside className="rounded-md border border-concrete-100 bg-white p-5 shadow-soft">
            <p className="text-sm font-semibold text-concrete-500">Category</p>
            <p className="mt-1 text-lg font-bold text-concrete-900">{product.category.name}</p>
            <p className="mt-5 text-sm font-semibold text-concrete-500">Stock</p>
            <p className="mt-1 text-lg font-bold text-concrete-900">
              {product.stockQuantity > 0 ? `${product.stockQuantity} available` : "Out of stock"}
            </p>
            <p className="mt-5 text-sm font-semibold text-concrete-500">SKU</p>
            <p className="mt-1 text-lg font-bold text-concrete-900">{product.sku}</p>
          </aside>
        </section>
        <script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          type="application/ld+json"
        />
      </main>
      <StorefrontFooter />
    </>
  );
}
