import Image from "next/image";
import { ArrowRight, CheckCircle2, Paintbrush, PackageCheck, Sparkles, Truck } from "lucide-react";
import { StorefrontFooter } from "@/components/storefront/footer";
import { StorefrontHeader } from "@/components/storefront/header";
import { ProductCard } from "@/components/storefront/product-card";
import { ButtonLink } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { getStoreSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, featuredProducts, categories, newArrivals, bestSellers] = await Promise.all([
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
    })
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
          <div className="absolute inset-0 bg-gradient-to-r from-concrete-900 via-concrete-900/65 to-transparent" />
          <div className="relative mx-auto flex min-h-[calc(100svh-76px)] max-w-7xl items-center px-4 py-16">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-wahaj-gold">
                Handmade in Egypt
              </p>
              <h1 className="mt-4 text-5xl font-bold leading-tight md:text-7xl">Wahaj | وهج</h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-concrete-100">
                Premium concrete decor designed around your color, finish, and add-on choices.
                Browse, customize, and place a cash on delivery order in minutes.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/products">
                  Shop products <ArrowRight size={18} />
                </ButtonLink>
                <ButtonLink href="#customization" variant="ghost" className="bg-white/10 text-white hover:bg-white/20">
                  See customization
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-wahaj-gold">
                Featured
              </p>
              <h2 className="mt-2 text-3xl font-bold text-concrete-900">Signature pieces</h2>
            </div>
            <ButtonLink href="/products" variant="ghost">
              View all
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
                  Category
                </span>
                <h3 className="mt-4 text-2xl font-bold text-concrete-900">{category.name}</h3>
                <p className="mt-2 text-sm leading-6 text-concrete-600">
                  {category.description || "Customizable concrete decor pieces."}
                </p>
              </a>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[0.9fr_1.1fr]" id="customization">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-wahaj-gold">
              Why Wahaj
            </p>
            <h2 className="mt-2 text-3xl font-bold text-concrete-900">
              Built for color-specific product previews.
            </h2>
            <p className="mt-4 leading-8 text-concrete-600">
              Every color option can have its own uploaded product image. Add-ons are managed
              from the dashboard, assigned per product, and recalculated on the server when the
              order is created.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Paintbrush, title: "Choose a color", text: "Gray, white, black, beige, or custom options." },
              { icon: Sparkles, title: "Add premium details", text: "Gold leaf, silver leaf, stones, and more." },
              { icon: PackageCheck, title: "Snapshot orders", text: "The order keeps historical prices and options." },
              { icon: Truck, title: "COD checkout", text: "Cash on delivery with configurable shipping." }
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
              New arrivals
            </p>
            <h2 className="mt-2 text-3xl font-bold text-concrete-900">Fresh from the studio</h2>
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
                Best sellers
              </p>
              <h2 className="mt-2 text-3xl font-bold">Customer favorites</h2>
              <p className="mt-4 text-concrete-200">
                Products marked as best sellers from the admin dashboard appear here.
              </p>
            </div>
            <div className="grid gap-3">
              {bestSellers.map((product) => (
                <a
                  className="flex items-center justify-between rounded-md border border-white/10 p-4 hover:bg-white/5"
                  href={`/products/${product.slug}`}
                  key={product.id}
                >
                  <span className="font-semibold">{product.name}</span>
                  <ArrowRight size={18} />
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16">
          <div className="grid gap-5 md:grid-cols-3">
            {["Pick product", "Customize", "Receive COD"].map((title, index) => (
              <div className="rounded-md border border-concrete-100 bg-white p-5" key={title}>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-wahaj-teal text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-xl font-bold text-concrete-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-concrete-600">
                  {index === 0
                    ? "Browse products with search and filters."
                    : index === 1
                      ? "Select color image and add-ons with live price updates."
                      : "Place the order and pay cash on delivery."}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-concrete-100 bg-white py-16">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="text-3xl font-bold text-concrete-900">Customer notes</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {[
                "The color preview made the custom order easy.",
                "The tray arrived exactly as selected.",
                "Premium finish and careful packaging."
              ].map((text) => (
                <figure className="rounded-md bg-concrete-50 p-5" key={text}>
                  <CheckCircle2 className="text-wahaj-teal" size={22} />
                  <blockquote className="mt-4 text-sm leading-7 text-concrete-700">{text}</blockquote>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16">
          <div className="rounded-md bg-wahaj-teal p-8 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/80">
              Social
            </p>
            <h2 className="mt-2 text-3xl font-bold">Instagram feed placeholder</h2>
            <p className="mt-3 max-w-2xl text-white/85">
              Ready for Instagram/Facebook integration later without making social media the order source.
            </p>
          </div>
        </section>
      </main>
      <StorefrontFooter />
    </>
  );
}
