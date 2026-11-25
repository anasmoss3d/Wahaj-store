import { StorefrontHeader } from "@/components/storefront/header";
import { StorefrontFooter } from "@/components/storefront/footer";
import { HeroSection } from "@/components/storefront/hero-section";
import { ScentMomentsShowcase } from "@/components/storefront/scent-moments-showcase";
import { CraftArchedSection } from "@/components/storefront/craft-arched";
import { CuratedScentsShowcase } from "@/components/storefront/curated-scents-showcase";
import { CollectionBrowser } from "@/components/storefront/collection-browser";
import { ScentArchive } from "@/components/storefront/scent-archive";
import { CareRitualLight } from "@/components/storefront/care-ritual-light";
import { FaqSection } from "@/components/storefront/faq-section";
import { NewsletterGlow } from "@/components/storefront/newsletter-glow";
import { prisma } from "@/lib/db";
import { getDictionary, getLocale } from "@/lib/i18n";
import { getStoreSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [locale, dict, rawProducts, settings] = await Promise.all([
    getLocale(),
    getDictionary(),
    prisma.product.findMany({
      where: { active: true },
      include: {
        category: { select: { slug: true, name: true, nameEn: true } },
        colors: { where: { active: true }, select: { id: true }, take: 1 },
        sizes: { where: { active: true }, select: { id: true }, take: 1 }
      },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }]
    }),
    getStoreSettings()
  ]);

  // Clean serialization for client component boundary (converting Decimal to number)
  // and prioritizing candle products so candles show first in the collection browser
  const products = rawProducts
    .map((p) => ({
      ...p,
      basePrice: Number(p.basePrice) as unknown as typeof p.basePrice,
      requiresOptions: p.colors.length > 0 || p.sizes.length > 0
    }))
    .sort((a, b) => {
      const aIsCandle =
        a.category?.slug === "candles" ||
        a.slug.includes("candle") ||
        a.name.includes("شمعة") ||
        (a.nameEn ?? "").toLowerCase().includes("candle")
          ? 1
          : 0;
      const bIsCandle =
        b.category?.slug === "candles" ||
        b.slug.includes("candle") ||
        b.name.includes("شمعة") ||
        (b.nameEn ?? "").toLowerCase().includes("candle")
          ? 1
          : 0;
      return bIsCandle - aIsCandle;
    });

  return (
    <div className="min-h-screen bg-[#F7F4EE] text-[#1C1917] selection:bg-[#B85A2D]/20 selection:text-[#1C1917]">
      {/* 1. Seamless Single-Line Luxury Navbar with Integrated Search */}
      <StorefrontHeader />

      <main>
        {/* 2. Hero Section: Spacious Editorial Staging (Matching Reference Image 1) */}
        <HeroSection locale={locale} dict={dict} />

        {/* 3. Product Showcase: "A scent for staying in." (Matching Reference Image 4) */}
        <ScentMomentsShowcase products={products} locale={locale} dict={dict} />

        {/* 4. Craftsmanship: "Made slowly, made simply." with Arched Niche (Matching Reference Image 1) */}
        <CraftArchedSection locale={locale} dict={dict} />

        {/* 5. Curated Scents: "A soft glint for your quiet moments" (Matching Reference Image 2) */}
        <CuratedScentsShowcase products={products} locale={locale} dict={dict} />

        {/* 6. Shop Collection Browser with Category Filters (Matching Reference Image 3) */}
        <CollectionBrowser products={products} locale={locale} dict={dict} />

        {/* 7. Signature Fragrance Archive with Lifestyle Vignettes (Matching Reference Image 4) */}
        <ScentArchive products={products} locale={locale} dict={dict} />

        {/* 8. Candle Care Ritual: "A better burn, in three steps" (Matching Reference Image 2) */}
        <CareRitualLight locale={locale} dict={dict} />

        {/* 9. FAQ Section: "Good to know" */}
        <FaqSection locale={locale} dict={dict} whatsappNumber={settings.whatsappNumber} />

        {/* 10. Newsletter: "Bring a little glow home." in Sage Container (Matching Reference Image 4) */}
        <NewsletterGlow locale={locale} dict={dict} />
      </main>

      {/* 11. Luxury Editorial Footer */}
      <StorefrontFooter />
    </div>
  );
}
