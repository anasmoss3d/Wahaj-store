import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { ProductCustomizer } from "@/components/storefront/product-customizer";
import { ReviewForm, Stars } from "@/components/storefront/reviews";
import { StorefrontFooter } from "@/components/storefront/footer";
import { StorefrontHeader } from "@/components/storefront/header";
import { WishlistButton } from "@/components/storefront/wishlist-button";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDictionary } from "@/lib/i18n";
import { productJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

const getProduct = cache(async function getProduct(slug: string) {
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
});

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
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
  const [product, user, dict] = await Promise.all([
    getProduct(slug),
    getCurrentUser(),
    getDictionary()
  ]);
  if (!product || product.colors.length === 0) notFound();

  const [reviews, ratingAgg, wishlisted] = await Promise.all([
    prisma.review.findMany({
      where: { productId: product.id, approved: true },
      orderBy: { createdAt: "desc" },
      take: 10
    }),
    prisma.review.aggregate({
      where: { productId: product.id, approved: true },
      _avg: { rating: true },
      _count: { rating: true }
    }),
    user
      ? prisma.wishlistItem.findUnique({
          where: { userId_productId: { userId: user.id, productId: product.id } }
        })
      : null
  ]);

  const jsonLd = productJsonLd(product);
  const avg = ratingAgg._avg.rating ?? 0;
  const reviewCount = ratingAgg._count.rating;

  return (
    <>
      <StorefrontHeader />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex justify-end">
          <WishlistButton
            initialSaved={Boolean(wishlisted)}
            isLoggedIn={Boolean(user)}
            labels={{ save: dict.addToWishlist, remove: dict.removeFromWishlist, login: dict.loginToSave }}
            productId={product.id}
          />
        </div>
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
          labels={{
            madeToOrder: dict.madeToOrder,
            startsAt: dict.startsAt,
            chooseColor: dict.chooseColor,
            addExtras: dict.addExtras,
            included: dict.included,
            quantity: dict.quantity,
            total: dict.total,
            addToCart: dict.addToCart,
            buyNow: dict.buyNow,
            added: dict.addedToCart
          }}
        />
        <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold text-concrete-900">{dict.details}</h2>
            <p className="mt-3 leading-8 text-concrete-700">{product.description}</p>
          </div>
          <aside className="rounded-md border border-concrete-100 bg-white p-5 shadow-soft">
            <p className="text-sm font-semibold text-concrete-500">{dict.category}</p>
            <p className="mt-1 text-lg font-bold text-concrete-900">{product.category.name}</p>
            <p className="mt-5 text-sm font-semibold text-concrete-500">{dict.stock}</p>
            <p className="mt-1 text-lg font-bold text-concrete-900">
              {product.stockQuantity > 0 ? `${product.stockQuantity} ${dict.available}` : dict.outOfStock}
            </p>
            <p className="mt-5 text-sm font-semibold text-concrete-500">SKU</p>
            <p className="mt-1 text-lg font-bold text-concrete-900">{product.sku}</p>
          </aside>
        </section>

        <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_420px]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-concrete-900">{dict.reviews}</h2>
              {reviewCount > 0 ? (
                <span className="inline-flex items-center gap-2 text-sm text-concrete-600">
                  <Stars value={Math.round(avg)} />
                  {avg.toFixed(1)} · {reviewCount}
                </span>
              ) : null}
            </div>
            <div className="mt-5 grid gap-4">
              {reviews.length === 0 ? (
                <p className="rounded-md border border-concrete-100 bg-white p-5 text-sm text-concrete-600">
                  {dict.noReviews}
                </p>
              ) : (
                reviews.map((review) => (
                  <article
                    className="rounded-md border border-concrete-100 bg-white p-5 shadow-soft"
                    key={review.id}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-concrete-900">{review.name}</p>
                      <Stars value={review.rating} />
                    </div>
                    {review.title ? (
                      <p className="mt-2 font-semibold text-concrete-800">{review.title}</p>
                    ) : null}
                    <p className="mt-2 text-sm leading-7 text-concrete-600">{review.body}</p>
                  </article>
                ))
              )}
            </div>
          </div>
          <ReviewForm
            labels={{
              title: dict.writeReview,
              name: dict.yourName,
              rating: dict.rating,
              reviewTitle: dict.reviewTitle,
              body: dict.reviewBody,
              submit: dict.submitReview,
              saving: dict.saving,
              pending: dict.reviewPending
            }}
            productId={product.id}
          />
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
