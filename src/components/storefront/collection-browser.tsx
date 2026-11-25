"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { Product } from "@prisma/client";
import type { Locale, Dictionary } from "@/lib/i18n";
import { pickLocalized } from "@/lib/dictionary";
import { formatMoney } from "@/lib/money";
import { CountUpNumber, useInViewOnce } from "@/components/storefront/scroll-animations";

type BrowserProduct = Product & {
  category?: { slug: string; name: string; nameEn?: string | null } | null;
};

interface Props {
  products: BrowserProduct[];
  locale: Locale;
  dict: Dictionary;
}

const INITIAL_VISIBLE_COUNT = 6;
const CANDLE_SLUGS = new Set(["candles"]);
const DECOR_SLUGS = new Set(["trays", "candle-holders", "organizers", "vases", "custom-products"]);

function matchesCategory(product: BrowserProduct, categoryId: string): boolean {
  const catSlug = product.category?.slug?.toLowerCase() ?? "";
  const slug = product.slug.toLowerCase();
  const combinedName = `${product.name} ${product.nameEn ?? ""}`.toLowerCase();

  if (categoryId === "candles") {
    return CANDLE_SLUGS.has(catSlug) || slug.includes("candle") || combinedName.includes("candle") || combinedName.includes("شمعة");
  }
  if (categoryId === "decor") {
    return (
      DECOR_SLUGS.has(catSlug) ||
      combinedName.includes("tray") ||
      combinedName.includes("organizer") ||
      combinedName.includes("set") ||
      combinedName.includes("صينية")
    );
  }
  if (categoryId === "bestsellers") {
    return Boolean(product.bestSeller);
  }
  return true;
}

export function CollectionBrowser({ products, locale, dict }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"bestselling" | "price-asc" | "price-desc">("bestselling");
  const [showAll, setShowAll] = useState(false);
  const isArabic = locale === "ar";
  const { ref: sectionRef, inView } = useInViewOnce<HTMLElement>(0.08);

  const hasCandles = products.some((p) => matchesCategory(p, "candles"));
  const hasDecor = products.some((p) => matchesCategory(p, "decor"));
  const categories = [
    { id: "all", label: dict.filterAll || (isArabic ? "الكل" : "All Products") },
    ...(hasCandles ? [{ id: "candles", label: dict.filterCandles || (isArabic ? "الشموع" : "Soy Candles") }] : []),
    ...(hasDecor ? [{ id: "decor", label: isArabic ? "صواني وديكور" : "Trays & Decor" }] : []),
    { id: "bestsellers", label: isArabic ? "الأكثر مبيعاً" : "Bestsellers" }
  ];

  const filteredProducts = useMemo(() => {
    const list = activeCategory === "all"
      ? [...products]
      : products.filter((p) => matchesCategory(p, activeCategory));

    if (sortBy === "price-asc") {
      list.sort((a, b) => Number(a.basePrice) - Number(b.basePrice));
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => Number(b.basePrice) - Number(a.basePrice));
    } else {
      list.sort((a, b) => (b.bestSeller ? 1 : 0) - (a.bestSeller ? 1 : 0));
    }

    return list;
  }, [products, activeCategory, sortBy]);

  const visibleProducts = showAll
    ? filteredProducts
    : filteredProducts.slice(0, INITIAL_VISIBLE_COUNT);
  const remainingCount = Math.max(0, filteredProducts.length - INITIAL_VISIBLE_COUNT);

  return (
    <section
      id="collection"
      ref={sectionRef}
      className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-12 border-b border-[#E8E2D8] bg-[#FAF8F5]"
    >
      <div className="mx-auto max-w-7xl">
        {/* Section Header with Count-Up Product Total */}
        <div
          className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-6 sm:mb-8 transition-all duration-[600ms] ease-out"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(16px)"
          }}
        >
          <div>
            <div className="flex items-baseline gap-3">
              <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#1C1917] font-black tracking-tight">
                {dict.shopSectionTitle || (isArabic ? "المتجر" : "Collection")}
              </h2>
              <span className="font-editorial text-lg text-[#8C7E72] font-light">
                (<CountUpNumber target={filteredProducts.length} active={inView} duration={650} />)
              </span>
            </div>
            <p className="mt-2.5 max-w-xl text-xs sm:text-sm text-[#78716C] leading-relaxed font-light">
              {dict.shopSectionDesc ||
                (isArabic
                  ? "مصنوعة من شمع الصويا النقي ١٠٠٪. صُممت شموعنا لتجلب دفئاً حقيقياً يغمر حواسك وينشر عبقاً غنياً في بيتك."
                  : "Handcrafted from 100% natural soy wax. Designed to bring effortless warmth and botanical scent to your space.")}
            </p>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#8C827A] hidden sm:inline-block">
              {isArabic ? "الترتيب:" : "Sort:"}
            </span>
            <div className="relative inline-flex items-center rounded-full border border-[#DED7CB] bg-white px-4 py-2 shadow-sm">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as "bestselling" | "price-asc" | "price-desc");
                  setShowAll(false);
                }}
                className="appearance-none bg-transparent pe-6 text-xs font-medium text-[#1C1917] cursor-pointer outline-none"
              >
                <option value="bestselling">{dict.sortByBestSelling || (isArabic ? "الأكثر طلباً" : "Best Selling")}</option>
                <option value="price-asc">{dict.sortByPriceLowHigh || (isArabic ? "السعر: من الأقل للأعلى" : "Price: Low to High")}</option>
                <option value="price-desc">{isArabic ? "السعر: من الأعلى للأقل" : "Price: High to Low"}</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute end-3 text-[#78716C]" />
            </div>
          </div>
        </div>

        {/* Horizontal Category Filter Pills */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 mb-6 sm:mb-8 no-scrollbar">
          {categories.map((cat, idx) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  setShowAll(false);
                }}
                className={`shrink-0 rounded-full px-5 py-2 text-xs font-medium transition-all duration-300 ${
                  isActive
                    ? "bg-[#1C1917] text-white shadow-sm"
                    : "bg-white/80 border border-[#DDD5C7] text-[#665E57] hover:bg-white hover:text-[#1C1917] hover:border-[#B85A2D]"
                }`}
                style={{
                  opacity: inView ? 1 : 0,
                  transform: inView ? "translateY(0)" : "translateY(10px)",
                  transitionDelay: `${60 + idx * 40}ms`
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Compact Curated Product Shelf on Mobile, Grid on Tablet/Desktop */}
        <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-x-7 sm:gap-y-10 overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:snap-none no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 scroll-px-4 pb-2 sm:pb-0">
          {visibleProducts.map((p, idx) => {
            const displayName = pickLocalized(locale, p.name, p.nameEn);
            const imageSrc = p.mainImage || "/brand/hero-candle.jpg";
            const staggerDelay = Math.min(idx, 5) * 50;

            return (
              <Link
                key={p.id}
                href={`/products/${p.slug}`}
                className="group block shrink-0 w-[66vw] max-w-[260px] sm:w-auto sm:max-w-none snap-start sm:snap-align-none transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  opacity: inView ? 1 : 0,
                  transform: inView ? "translateY(0)" : "translateY(18px)",
                  transitionDelay: `${80 + staggerDelay}ms`
                }}
              >
                {/* Product Photo Mount */}
                <div className="relative aspect-[5/4] w-full overflow-hidden rounded-xl sm:rounded-2xl bg-[#EDE7DD] transition-all duration-500 shadow-sm group-hover:shadow-md">
                  <Image
                    alt={displayName}
                    src={imageSrc}
                    fill
                    sizes="(min-width: 1024px) 30vw, 46vw"
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  />
                </div>

                {/* Metadata Row */}
                <div className="mt-3 sm:mt-4 flex items-baseline justify-between gap-2 sm:gap-3">
                  <span className="font-editorial text-sm sm:text-lg lg:text-xl font-bold text-[#1C1917] group-hover:text-[#B85A2D] transition-colors truncate">
                    {displayName}
                  </span>
                  <span className="shrink-0 text-xs sm:text-sm text-[#78716C] font-light">
                    {formatMoney(Number(p.basePrice).toFixed(2), "EGP", locale)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Clean Expand / Full-Catalog Controls */}
        <div className="mt-9 sm:mt-11 flex flex-wrap items-center justify-center gap-3.5">
          {remainingCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D8CFC2] bg-white px-6 py-3 text-xs sm:text-sm font-medium text-[#1C1917] shadow-sm transition-all duration-300 hover:border-[#B85A2D] hover:text-[#B85A2D] active:scale-[0.98]"
            >
              {showAll
                ? isArabic
                  ? "عرض أقل"
                  : "Show fewer"
                : isArabic
                  ? `عرض باقي المنتجات (${remainingCount})`
                  : `Show ${remainingCount} more`}
            </button>
          )}

          <Link
            href={activeCategory === "candles" ? "/products?category=candles" : "/products"}
            className="inline-flex items-center justify-center gap-2.5 rounded-full bg-[#1C1917] px-7 py-3 text-xs sm:text-sm font-medium text-white shadow-sm transition-all duration-300 hover:bg-[#B85A2D] active:scale-[0.98]"
          >
            <span>{isArabic ? "تصفح المتجر بالكامل" : "Browse full shop"}</span>
            <ArrowRight size={15} className={isArabic ? "rotate-180" : ""} />
          </Link>
        </div>
      </div>
    </section>
  );
}
