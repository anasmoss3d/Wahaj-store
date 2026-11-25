"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Locale, Dictionary } from "@/lib/i18n";
import { pickLocalized } from "@/lib/dictionary";
import type { ShowcaseProductItem } from "@/components/storefront/scent-moments-showcase";

interface ScentItem {
  id: string;
  nameEn: string;
  nameAr: string;
  notesEn: string;
  notesAr: string;
  slug: string;
}

const DEFAULT_SCENTS: ScentItem[] = [
  {
    id: "1",
    nameEn: "Pine Needle + Cold Mint",
    nameAr: "إبر الصنوبر + النعناع المنعش",
    notesEn: "Crisp pine · fresh spearmint · forest breeze",
    notesAr: "صنوبر ندي · نعناع طازج · نسيم الغابة",
    slug: "pine-needle-cold-mint-candle"
  },
  {
    id: "2",
    nameEn: "Eucalyptus + White Sage",
    nameAr: "يوكالبتوس + ميرمية بيضاء",
    notesEn: "Crushed leaves · white tea · grounding herb",
    notesAr: "أوراق مطحونة · شاي أبيض · هدوء عشبي",
    slug: "eucalyptus-white-sage-candle"
  }
];

export function ScentArchive({
  products,
  locale
}: {
  products?: ShowcaseProductItem[];
  locale: Locale;
  dict: Dictionary;
}) {
  const isArabic = locale === "ar";
  const scents: ScentItem[] =
    products && products.length > 0
      ? products.slice(0, 6).map((p) => ({
          id: p.id,
          nameAr: pickLocalized("ar", p.name, p.nameEn),
          nameEn: pickLocalized("en", p.name, p.nameEn),
          notesAr: pickLocalized("ar", p.description, p.descriptionEn),
          notesEn: pickLocalized("en", p.description, p.descriptionEn),
          slug: p.slug
        }))
      : DEFAULT_SCENTS;
  const sectionRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const setReducedStatic = () => {
      section.style.setProperty("--arch-p", "0");
      for (const el of itemRefs.current) {
        if (el) el.style.setProperty("--focus", "1");
      }
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReducedStatic();
      return;
    }

    let rafId = 0;

    const update = () => {
      rafId = 0;
      const viewportH = window.innerHeight || 900;
      const sRect = section.getBoundingClientRect();

      // Normalized vertical position [-1 .. 1] for opposing parallax vignettes
      const archP = Math.min(
        1,
        Math.max(-1, (viewportH * 0.5 - (sRect.top + sRect.height * 0.5)) / viewportH)
      );
      section.style.setProperty("--arch-p", archP.toFixed(4));

      // Spotlight reading focus per scent row near the middle reading band of the viewport
      const focalY = viewportH * 0.48;
      const band = Math.max(220, viewportH * 0.36);

      for (const el of itemRefs.current) {
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const centerY = rect.top + rect.height * 0.5;
        const dist = Math.abs(centerY - focalY);
        const linear = Math.max(0, 1 - dist / band);
        const focus = Math.pow(linear, 1.35);
        el.style.setProperty("--focus", focus.toFixed(4));
      }
    };

    const schedule = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <section
      id="scents"
      ref={sectionRef}
      className="relative py-20 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-12 overflow-hidden border-b border-[#DDD4C7] bg-[#EBE4D8]"
      style={{ "--arch-p": "0" } as React.CSSProperties}
    >
      {/* Top Floating Lifestyle Vignette moving gently upward on scroll */}
      <div
        className="absolute top-16 end-8 sm:end-14 lg:end-24 w-32 h-44 sm:w-44 sm:h-60 rounded-2xl overflow-hidden border border-[#D5CCA6]/40 shadow-sm opacity-90 hidden sm:block pointer-events-none will-change-transform"
        style={{
          transform: "translate3d(0, calc(var(--arch-p, 0) * -46px), 0)"
        }}
      >
        <Image
          alt="Lifestyle candle arrangement with ceramic vase"
          src="/brand/vignette-top.jpg"
          fill
          sizes="180px"
          className="object-cover"
        />
      </div>

      {/* Bottom Floating Lifestyle Vignette moving gently downward (opposing depth) */}
      <div
        className="absolute bottom-16 start-8 sm:start-14 lg:start-24 w-32 h-44 sm:w-44 sm:h-60 rounded-2xl overflow-hidden border border-[#D5CCA6]/40 shadow-sm opacity-90 hidden sm:block pointer-events-none will-change-transform"
        style={{
          transform: "translate3d(0, calc(var(--arch-p, 0) * 46px), 0)"
        }}
      >
        <Image
          alt="Lifestyle candle on draped white textured linen"
          src="/brand/vignette-bottom.jpg"
          fill
          sizes="180px"
          className="object-cover"
        />
      </div>

      {/* Centered Scent Library with Scroll Reading Spotlight */}
      <div className="relative mx-auto max-w-2xl text-center z-10">
        
        {/* Section Header */}
        <div className="mb-12 sm:mb-16">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#8C7A6B] mb-2 font-medium">
            {isArabic ? "أرشيف النغمات العطرية" : "OUR BOTANICAL LIBRARY"}
          </p>
          <h2 className="font-editorial text-3xl sm:text-4xl text-[#1C1917] font-black">
            {isArabic ? "توليفات صُنعت لأمسيات تدوم" : "Formulations for quiet moments"}
          </h2>
        </div>

        {/* Scent Pairings List: Each item illuminates cleanly in the reading spotlight */}
        <div className="flex flex-col items-center space-y-6 sm:space-y-8">
          {scents.map((scent, idx) => {
            const name = isArabic ? scent.nameAr : scent.nameEn;
            const notes = isArabic ? scent.notesAr : scent.notesEn;

            return (
              <Link
                key={scent.id}
                ref={(el) => {
                  itemRefs.current[idx] = el;
                }}
                href={`/products/${scent.slug}`}
                className="group flex flex-col items-center will-change-transform transition-colors duration-200"
                style={
                  {
                    "--focus": "1",
                    opacity: "calc(0.28 + var(--focus, 1) * 0.72)",
                    transform: "scale(calc(0.94 + var(--focus, 1) * 0.06))"
                  } as React.CSSProperties
                }
              >
                <span className="font-editorial text-2xl sm:text-3xl lg:text-4xl font-bold text-[#9E4A22] group-hover:text-[#1C1917] transition-colors">
                  {name}
                </span>
                <span
                  className="max-w-lg line-clamp-2 text-[11px] sm:text-xs text-[#6B6157] font-light mt-1 transition-opacity"
                  style={{
                    opacity: "calc(0.35 + var(--focus, 1) * 0.65)"
                  }}
                >
                  {notes}
                </span>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}
