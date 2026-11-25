"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { Locale, Dictionary } from "@/lib/i18n";
import { pickLocalized } from "@/lib/dictionary";
import { formatMoney } from "@/lib/money";
import type { ShowcaseProductItem } from "@/components/storefront/scent-moments-showcase";
import { useInViewOnce, useScrollVars } from "@/components/storefront/scroll-animations";

interface CuratedItem {
  id: string;
  nameEn: string;
  nameAr: string;
  notesEn: string;
  notesAr: string;
  price: number;
  slug: string;
  image: string;
}

const DEFAULT_CURATED_CANDLES: CuratedItem[] = [
  {
    id: "1",
    nameEn: "Cedar Hour",
    nameAr: "ساعة الأرز",
    notesEn: "Cedarwood · fig leaf · soft smoke",
    notesAr: "خشب الأرز · أوراق التين · دخان خفيف",
    price: 240,
    slug: "cedar-hour",
    image: "/products/cedar-hour.jpg"
  },
  {
    id: "2",
    nameEn: "After Rain",
    nameAr: "بعد المطر",
    notesEn: "Rainwater · rosemary · cool stone",
    notesAr: "مطر ندي · إكليل الجبل · حجر بارد",
    price: 240,
    slug: "after-rain",
    image: "/products/after-rain.jpg"
  },
  {
    id: "3",
    nameEn: "Citrus Sunday",
    nameAr: "أحد الحمضيات",
    notesEn: "Blood orange · neroli · green leaves",
    notesAr: "برتقال دموي · زهر البرتقال · أوراق خضراء",
    price: 260,
    slug: "citrus-sunday",
    image: "/products/citrus-sunday.jpg"
  }
];

export function CuratedScentsShowcase({
  products,
  locale,
  dict
}: {
  products?: ShowcaseProductItem[];
  locale: Locale;
  dict: Dictionary;
}) {
  const isArabic = locale === "ar";
  const items: CuratedItem[] =
    products && products.length > 0
      ? products.slice(0, 6).map((p) => ({
          id: p.id,
          nameAr: pickLocalized("ar", p.name, p.nameEn),
          nameEn: pickLocalized("en", p.name, p.nameEn),
          notesAr: pickLocalized("ar", p.description, p.descriptionEn),
          notesEn: pickLocalized("en", p.description, p.descriptionEn),
          price: Number(p.basePrice),
          slug: p.slug,
          image: p.mainImage
        }))
      : DEFAULT_CURATED_CANDLES;
  const { ref: inViewRef, inView } = useInViewOnce<HTMLDivElement>(0.12);

  // Subtle center-column offset parallax across the 3-column grid
  const scrollRef = useScrollVars<HTMLElement>(
    (_el, rect, viewportH) => {
      const mid = (viewportH * 0.5 - (rect.top + rect.height * 0.5)) / viewportH;
      const clamped = Math.min(0.8, Math.max(-0.8, mid));
      return {
        "--col-offset": clamped.toFixed(4)
      };
    },
    { "--col-offset": "0" }
  );

  return (
    <section
      id="curated"
      ref={scrollRef}
      className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-12 bg-[#E7ECE5] border-b border-[#D5DCD3] overflow-hidden"
      style={{ "--col-offset": "0" } as React.CSSProperties}
    >
      <div ref={inViewRef} className="mx-auto max-w-7xl">
        
        {/* Split Horizontal Header Entrance */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div
            className="max-w-2xl transition-all duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView
                ? "translateX(0)"
                : isArabic
                ? "translateX(28px)"
                : "translateX(-28px)"
            }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-[#CBD5C8] bg-white/70 px-3 py-1 mb-3 text-[11px] font-medium text-[#5F6A5B]">
              <Sparkles size={12} className="text-[#8C6445]" />
              <span>{isArabic ? "مختارات الموسم" : "CURATED MOMENTS"}</span>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl text-[#1C1917] font-black leading-tight">
              {dict.curatedTitle || (isArabic ? "وهجٌ هادئ للحظاتك الخاصة" : "A soft glint for your quiet moments")}
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-[#5C645A] leading-relaxed font-light">
              {isArabic
                ? "مجموعة مختارة من الشموع الطبيعية بروائح نباتية مصممة لخلق جو من السكينة في بيتك."
                : "A thoughtful selection of pure botanical soy candles created to bring effortless warmth into your space."}
            </p>
          </div>

          <Link
            href="#collection"
            className="shrink-0 inline-flex items-center gap-2.5 rounded-full border border-[#CBD5C8] bg-white/90 px-6 py-3 text-xs font-medium text-[#1C1917] hover:bg-[#1C1917] hover:text-white hover:border-[#1C1917] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] shadow-sm self-start md:self-auto"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView
                ? "translateX(0)"
                : isArabic
                ? "translateX(-28px)"
                : "translateX(28px)",
              transitionDelay: "120ms"
            }}
          >
            <span>{dict.shopAllScents || (isArabic ? "تصفح كل الشموع" : "Shop All Candles")}</span>
            <ArrowRight size={14} className={isArabic ? "rotate-180" : ""} />
          </Link>
        </div>

        {/* 6 High-End Candle Cards: Horizontal Snap Shelf on Mobile, Grid on Tablet/Desktop */}
        <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-x-8 sm:gap-y-12 overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:snap-none no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 scroll-px-4 pb-2 sm:pb-0">
          {items.map((item, idx) => {
            const title = isArabic ? item.nameAr : item.nameEn;
            const notes = isArabic ? item.notesAr : item.notesEn;
            const isMiddleCol = idx % 3 === 1;

            return (
              <div
                key={item.id}
                className={`shrink-0 w-[76vw] max-w-[310px] sm:w-auto sm:max-w-none snap-start sm:snap-align-none ${
                  isMiddleCol
                    ? "lg:will-change-transform lg:[transform:translate3d(0,calc(var(--col-offset,0)*-22px),0)]"
                    : ""
                }`}
              >
                <Link
                  href={`/products/${item.slug}`}
                  className="group block transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{
                    opacity: inView ? 1 : 0,
                    transform: inView ? "translateY(0) scale(1)" : "translateY(26px) scale(0.97)",
                    transitionDelay: `${120 + idx * 80}ms`
                  }}
                >
                  {/* Candle photo in soft ivory mount */}
                  <div className="relative aspect-[4/3] sm:aspect-square w-full overflow-hidden rounded-2xl bg-[#DCE2DA] transition-all duration-500 shadow-sm">
                    <Image
                      alt={title}
                      src={item.image}
                      fill
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                      className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>

                  {/* Metadata: Title and Price */}
                  <div className="mt-4 flex items-baseline justify-between gap-2">
                    <span className="font-editorial text-xl sm:text-2xl font-bold text-[#1C1917] group-hover:text-[#B85A2D] transition-colors truncate">
                      {title}
                    </span>
                    <span className="shrink-0 text-xs text-[#5C645A] font-light">
                      {dict.fromPrice || (isArabic ? "من" : "from")} {formatMoney(item.price.toFixed(2), "EGP", locale)}
                    </span>
                  </div>

                  {/* Scent notes line */}
                  <p className="mt-1 text-xs text-[#6F776C] font-light truncate">
                    {notes}
                  </p>
                </Link>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
