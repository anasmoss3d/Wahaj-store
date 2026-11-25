import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CandleCareInstructions } from "@/components/storefront/candle-care-instructions";
import { ProductCustomizer } from "@/components/storefront/product-customizer";
import { ReviewForm, Stars } from "@/components/storefront/reviews";
import { StorefrontFooter } from "@/components/storefront/footer";
import { StorefrontHeader } from "@/components/storefront/header";
import { WishlistButton } from "@/components/storefront/wishlist-button";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDictionary, getLocale, isCustomColorName, pickLocalized } from "@/lib/i18n";
import { productJsonLd } from "@/lib/seo";
import { getProductColorImageUrl } from "@/lib/product-images";

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
      sizes: {
        where: { active: true, size: { active: true } },
        include: { size: true },
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
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) return {};

  const title =
    pickLocalized(locale, product.seoTitle, product.seoTitleEn) ||
    pickLocalized(locale, product.name, product.nameEn);
  const description =
    pickLocalized(locale, product.metaDescription, product.metaDescriptionEn) ||
    pickLocalized(locale, product.description, product.descriptionEn).slice(0, 155);

  return {
    title,
    description,
    alternates: product.canonicalUrl ? { canonical: product.canonicalUrl } : undefined,
    openGraph: {
      title,
      description,
      images: [product.mainImage]
    }
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [product, user, dict, locale] = await Promise.all([
    getProduct(slug),
    getCurrentUser(),
    getDictionary(),
    getLocale()
  ]);
  if (!product) notFound();

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

  const productName = pickLocalized(locale, product.name, product.nameEn);
  const productDescription = pickLocalized(locale, product.description, product.descriptionEn);
  const categoryName = pickLocalized(locale, product.category.name, product.category.nameEn);
  const jsonLd = productJsonLd(product, locale);
  const avg = ratingAgg._avg.rating ?? 0;
  const reviewCount = ratingAgg._count.rating;
  const isCandleProduct =
    product.category.slug === "candles" ||
    product.category.name.includes("شموع") ||
    product.slug.toLowerCase().includes("candle") ||
    product.name.includes("شمعة") ||
    (product.nameEn ?? "").toLowerCase().includes("candle");
  const colorOptions = product.colors.map((item) => ({
    id: item.id,
    name: pickLocalized(locale, item.color.name, item.color.nameEn),
    hexCode: item.color.hexCode,
    additionalPrice: Number(item.additionalPrice),
    isCustomColor: isCustomColorName(item.color.name, item.color.nameEn),
    imageUrl: getProductColorImageUrl(
      product.slug,
      item.color.nameEn ?? item.color.name,
      item.imageUrl
    )
  }));
  const sizeOptions = product.sizes.map((item) => ({
    id: item.id,
    name: pickLocalized(locale, item.size.name, item.size.nameEn),
    price: Number(item.price)
  }));
  const galleryImages = [
    { url: product.mainImage, alt: productName },
    ...product.images.map((image) => ({
      url: image.url,
      alt: pickLocalized(locale, image.alt, image.altEn) || productName
    })),
    ...(product.slug.trim().toLowerCase() === "vase"
      ? colorOptions.map((color) => ({
          url: color.imageUrl,
          alt: `${productName} - ${color.name}`
        }))
      : [])
  ];

  return (
    <>
      <StorefrontHeader />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 py-10 sm:py-14">
        <ProductCustomizer
          product={{
            id: product.id,
            name: productName,
            basePrice: Number(product.basePrice)
          }}
          action={
            <WishlistButton
              initialSaved={Boolean(wishlisted)}
              isLoggedIn={Boolean(user)}
              labels={{ save: dict.addToWishlist, remove: dict.removeFromWishlist, login: dict.loginToSave }}
              productId={product.id}
            />
          }
          colors={colorOptions}
          sizes={sizeOptions}
          addons={product.addons.map((item) => ({
            id: item.id,
            name: pickLocalized(locale, item.addon.name, item.addon.nameEn),
            description: pickLocalized(locale, item.addon.description, item.addon.descriptionEn),
            price: Number(item.addon.price),
            imageUrl: item.addon.imageUrl
          }))}
          images={galleryImages}
          locale={locale}
          rating={{ average: avg, count: reviewCount }}
          labels={{
            madeToOrder: dict.madeToOrder,
            startsAt: dict.startsAt,
            chooseColor: dict.chooseColor,
            chooseSize: dict.chooseSize,
            customColorHint: dict.customColorHint,
            addExtras: dict.addExtras,
            included: dict.included,
            quantity: dict.quantity,
            total: dict.total,
            addToCart: dict.addToCart,
            buyNow: dict.buyNow,
            added: dict.addedToCart,
            previousImage: dict.previousImage,
            nextImage: dict.nextImage,
            viewImage: dict.viewImage,
            productPhotos: dict.productPhotos,
            reviews: dict.reviews,
            writeReview: dict.writeReview
          }}
        />
        <section className="mt-14 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border border-[#E5DDD0] bg-[#FAF8F5] p-6 sm:p-8">
            <h2 className="font-editorial text-2xl sm:text-3xl font-black text-[#1C1917]">{dict.details}</h2>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#57534E] font-light">{productDescription}</p>
          </div>
          <aside className="rounded-2xl border border-[#E5DDD0] bg-white p-6 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)] h-fit">
            <p className="text-xs font-medium text-[#8C827A]">{dict.category}</p>
            <p className="mt-1 font-editorial text-lg font-bold text-[#1C1917]">{categoryName}</p>
            <div className="my-4 h-px bg-[#EDE8E0]" />
            <p className="text-xs font-medium text-[#8C827A]">SKU</p>
            <p className="mt-1 text-sm font-mono font-semibold text-[#1C1917]">{product.sku}</p>
          </aside>
        </section>

        {isCandleProduct ? <CandleCareInstructions locale={locale} /> : null}

        <section className="mt-14 grid gap-8 lg:grid-cols-[1fr_420px] scroll-mt-24" id="reviews">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-editorial text-2xl sm:text-3xl font-black text-[#1C1917]">{dict.reviews}</h2>
              {reviewCount > 0 ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-[#E5DDD0] bg-white px-3.5 py-1 text-xs font-medium text-[#57534E]">
                  <Stars value={Math.round(avg)} />
                  <span>{avg.toFixed(1)} · {reviewCount}</span>
                </span>
              ) : null}
            </div>
            <div className="mt-5 grid gap-4">
              {reviews.length === 0 ? (
                <p className="rounded-2xl border border-[#E5DDD0] bg-white p-6 text-sm text-[#78716C] font-light">
                  {dict.noReviews}
                </p>
              ) : (
                reviews.map((review) => (
                  <article
                    className="rounded-2xl border border-[#E5DDD0] bg-white p-5 sm:p-6 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]"
                    key={review.id}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-editorial text-base font-bold text-[#1C1917]">{review.name}</span>
                      <Stars value={review.rating} />
                    </div>
                    {review.title ? (
                      <p className="mt-2 text-sm font-semibold text-[#1C1917]">{review.title}</p>
                    ) : null}
                    <p className="mt-2 text-sm leading-relaxed text-[#665E57] font-light">{review.body}</p>
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
            locale={locale}
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
