import Image from "next/image";
import { ArrowRight, CheckCircle2, MessageCircle, Paintbrush, PackageCheck, Sparkles, Truck } from "lucide-react";
import { StorefrontFooter } from "@/components/storefront/footer";
import { StorefrontHeader } from "@/components/storefront/header";
import { ProductCard } from "@/components/storefront/product-card";
import { ButtonLink } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { getStoreSettings } from "@/lib/settings";
import { getDictionary } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, featuredProducts, categories, newArrivals, bestSellers, testimonials, dict] = await Promise.all([
    getStoreSettings(),
    prisma.product.findMany({
      where: { active: true, featured: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 4
    }),
    prisma.category.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: 6
    }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      take: 4
    }),
    prisma.product.findMany({
      where: { active: true, bestSeller: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 4
    }),
    prisma.review.findMany({
      where: { approved: true },
      include: { product: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 3
    }),
    getDictionary()
  ]);

  return (
    <>
      <StorefrontHeader />
      <main>
        <section className="relative min-h-[calc(100svh-76px)] overflow-hidden bg-concrete-900 text-white">
          <Image
            alt="Wahaj luxury concrete decor"
            className="object-cover opacity-70"
            fill
            priority
            sizes="100vw"
            src={settings.heroImage || "/seed/black-luxury-set.jpg"}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-concrete-900 via-concrete-900/65 to-transparent rtl:bg-gradient-to-l" />
          <div className="relative mx-auto flex min-h-[calc(100svh-76px)] max-w-7xl items-center px-4 py-16">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-wahaj-gold">
                {dict.heroKicker}
              </p>
              <h1 className="mt-4 text-5xl font-bold leading-tight md:text-7xl">{dict.storeNameFull}</h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-concrete-100">{dict.heroText}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/products">
                  {dict.shopProducts} <ArrowRight size={18} className="rtl:rotate-180" />
                </ButtonLink>
                <ButtonLink href="#customization" variant="ghost" className="bg-white/10 text-white hover:bg-white/20">
                  {dict.seeCustomization}
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-wahaj-gold">
                {dict.featured}
              </p>
              <h2 className="mt-2 text-3xl font-bold text-concrete-900">{dict.signaturePieces}</h2>
            </div>
            <ButtonLink href="/products" variant="ghost">
              {dict.viewAll}
            </ButtonLink>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section className="border-y border-concrete-100 bg-white py-16">
          <div className="mx-auto grid max-w-7xl gap-5 px-4 md:grid-cols-3">
            {categories.map((category) => (
              <a
                className="min-h-40 rounded-md border border-concrete-100 bg-concrete-50 p-5 transition hover:-translate-y-1 hover:shadow-soft"
                href={`/products?category=${category.slug}`}
                key={category.id}
              >
                <span className="text-sm font-semibold uppercase tracking-[0.12em] text-wahaj-teal">
                  {dict.category}
                </span>
                <h3 className="mt-4 text-2xl font-bold text-concrete-900">{category.name}</h3>
                <p className="mt-2 text-sm leading-6 text-concrete-600">{category.description}</p>
              </a>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[0.9fr_1.1fr]" id="customization">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-wahaj-gold">
              {dict.whyWahaj}
            </p>
            <h2 className="mt-2 text-3xl font-bold text-concrete-900">{dict.colorPreviewTitle}</h2>
            <p className="mt-4 leading-8 text-concrete-600">{dict.whyBody}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Paintbrush, title: dict.chooseColor, text: dict.featColorText },
              { icon: Sparkles, title: dict.addExtras, text: dict.featDetailText },
              { icon: PackageCheck, title: dict.reviewOrder, text: dict.featKeptText },
              { icon: Truck, title: dict.cashOnDelivery, text: dict.featCodText }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div className="rounded-md border border-concrete-100 bg-white p-5 shadow-soft" key={item.title}>
                  <Icon className="text-wahaj-teal" size={28} />
                  <h3 className="mt-4 font-bold text-concrete-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-concrete-600">{item.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-wahaj-gold">
              {dict.newArrivals}
            </p>
            <h2 className="mt-2 text-3xl font-bold text-concrete-900">{dict.freshFromStudio}</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section className="bg-concrete-900 py-16 text-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-wahaj-gold">
                {dict.bestSellers}
              </p>
              <h2 className="mt-2 text-3xl font-bold">{dict.customerFavorites}</h2>
              <p className="mt-4 text-concrete-200">{dict.bestSellersNote}</p>
            </div>
            <div className="grid gap-3">
              {bestSellers.map((product) => (
                <a
                  className="flex items-center justify-between rounded-md border border-white/10 p-4 hover:bg-white/5"
                  href={`/products/${product.slug}`}
                  key={product.id}
                >
                  <span className="font-semibold">{product.name}</span>
                  <ArrowRight size={18} className="rtl:rotate-180" />
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-3xl font-bold text-concrete-900">{dict.howItWorks}</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {[
              { title: dict.step1Title, text: dict.step1Text },
              { title: dict.step2Title, text: dict.step2Text },
              { title: dict.step3Title, text: dict.step3Text }
            ].map((step, index) => (
              <div className="rounded-md border border-concrete-100 bg-white p-5" key={step.title}>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-wahaj-teal text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-xl font-bold text-concrete-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-concrete-600">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        {testimonials.length > 0 ? (
          <section className="border-t border-concrete-100 bg-white py-16">
            <div className="mx-auto max-w-7xl px-4">
              <h2 className="text-3xl font-bold text-concrete-900">{dict.saidAboutWahaj}</h2>
              <div className="mt-6 grid gap-5 md:grid-cols-3">
                {testimonials.map((review) => (
                  <figure className="rounded-md bg-concrete-50 p-5" key={review.id}>
                    <CheckCircle2 className="text-wahaj-teal" size={22} />
                    <blockquote className="mt-4 text-sm leading-7 text-concrete-700">
                      {review.body}
                    </blockquote>
                    <figcaption className="mt-3 text-sm font-semibold text-concrete-900">
                      {review.name} · {review.product.name}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        ) : null}
        <section className="mx-auto max-w-7xl px-4 py-16">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-md bg-wahaj-teal p-8 text-white">
            <div>
              <h2 className="text-3xl font-bold">{dict.whatsappCtaTitle}</h2>
              <p className="mt-3 max-w-2xl text-white/85">{dict.whatsappCtaText}</p>
            </div>
            <a
              className="inline-flex min-h-12 items-center gap-2 rounded-md bg-white px-6 font-bold text-wahaj-teal"
              href={`https://wa.me/${settings.whatsappNumber.replace(/[^\d]/g, "")}`}
            >
              <MessageCircle size={20} /> {dict.whatsapp}
            </a>
          </div>
        </section>
      </main>
      <StorefrontFooter />
    </>
  );
}
