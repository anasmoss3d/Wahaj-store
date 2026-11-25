"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import type { Locale, Dictionary } from "@/lib/i18n";
import { pickLocalized } from "@/lib/dictionary";
import { formatMoney } from "@/lib/money";
import { useInViewOnce, useScrollVars } from "@/components/storefront/scroll-animations";

export interface ShowcaseProductItem {
  id: string;
  slug: string;
  name: string;
  nameEn?: string | null;
  description: string;
  descriptionEn?: string | null;
  basePrice: unknown;
  mainImage: string;
  requiresOptions?: boolean;
}

interface ProductMoment {
  id: string;
  badge: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  notesEn: string;
  notesAr: string;
  price: number;
  image: string;
  requiresOptions: boolean;
}

const DEFAULT_MOMENTS: ProductMoment[] = [
  {
    id: "cmwse15oc0001tuk8pqvk79mq",
    badge: "NO. 01",
    slug: "cedar-hour",
    nameEn: "Cedar Hour",
    nameAr: "ساعة الأرز",
    notesEn: "Cedarwood · fig leaf · soft smoke",
    notesAr: "خشب الأرز · أوراق التين · دخان خفيف",
    price: 240,
    image: "/products/cedar-hour.jpg",
    requiresOptions: false
  },
  {
    id: "cmwse15og0003tuk8e8o50zwk",
    badge: "NO. 02",
    slug: "after-rain",
    nameEn: "After Rain",
    nameAr: "بعد المطر",
    notesEn: "Rainwater · rosemary · cool stone",
    notesAr: "مطر ندي · إكليل الجبل · حجر بارد",
    price: 240,
    image: "/products/after-rain.jpg",
    requiresOptions: false
  },
  {
    id: "cmwse15oi0005tuk8c2q2bqyx",
    badge: "NO. 03",
    slug: "citrus-sunday",
    nameEn: "Citrus Sunday",
    nameAr: "أحد الحمضيات",
    notesEn: "Blood orange · neroli · green leaves",
    notesAr: "برتقال دموي · زهر البرتقال · أوراق خضراء",
    price: 260,
    image: "/products/citrus-sunday.jpg",
    requiresOptions: false
  }
];

export function ScentMomentsShowcase({
  products,
  locale,
  dict
}: {
  products?: ShowcaseProductItem[];
  locale: Locale;
  dict: Dictionary;
}) {
  const items: ProductMoment[] =
    products && products.length > 0
      ? products.slice(0, 3).map((p, idx) => ({
          id: p.id,
          badge: `NO. 0${idx + 1}`,
          slug: p.slug,
          nameAr: pickLocalized("ar", p.name, p.nameEn),
          nameEn: pickLocalized("en", p.name, p.nameEn),
          notesAr: pickLocalized("ar", p.description, p.descriptionEn),
          notesEn: pickLocalized("en", p.description, p.descriptionEn),
          price: Number(p.basePrice),
          image: p.mainImage,
          requiresOptions: Boolean(p.requiresOptions)
        }))
      : DEFAULT_MOMENTS;
  const isArabic = locale === "ar";
  const router = useRouter();
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { ref: cardsRef, inView: cardsInView } = useInViewOnce<HTMLDivElement>(0.12);

  // Scroll-linked color wipe across headline & subtle parallax on center card
  const sectionScrollRef = useScrollVars<HTMLElement>(
    (_el, rect, viewportH) => {
      // Header color sweep completes as section header travels from 92% to 42% of viewport height
      const wipe = Math.min(1, Math.max(0.12, (viewportH * 0.92 - rect.top) / (viewportH * 0.5)));
      // Parallax progress across the whole section [-0.5 .. 0.5]
      const mid = (viewportH * 0.5 - (rect.top + rect.height * 0.5)) / viewportH;
      const clampedMid = Math.min(0.6, Math.max(-0.6, mid));
      return {
        "--wipe": wipe.toFixed(4),
        "--cards-p": clampedMid.toFixed(4)
      };
    },
    { "--wipe": "1", "--cards-p": "0" }
  );

  async function handleAddToBag(item: ProductMoment) {
    if (item.requiresOptions) {
      router.push(`/products/${item.slug}`);
      return;
    }

    try {
      setAddingId(item.id);
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: item.id, quantity: 1 })
      });
      if (res.ok) {
        setAddedId(item.id);
        startTransition(() => {
          router.refresh();
        });
        setTimeout(() => setAddedId(null), 2400);
        return;
      }

      if (res.status === 400 || res.status === 404) {
        router.push(`/products/${item.slug}`);
      }
    } catch (err) {
      console.error("Failed to add candle to bag", err);
    } finally {
      setAddingId(null);
    }
  }

  const headlineBase = isArabic ? (
    <>
      عطرٌ <span className="font-black">لأمسيات البيت الهادئة.</span>
    </>
  ) : (
    <>
      A scent for <span className="font-black">{dict.scentMomentsItalic || "staying in."}</span>
    </>
  );

  const headlineLit = isArabic ? (
    <>
      عطرٌ <span className="font-black text-[#B85A2D]">لأمسيات البيت الهادئة.</span>
    </>
  ) : (
    <>
      A scent for <span className="font-black text-[#B85A2D]">{dict.scentMomentsItalic || "staying in."}</span>
    </>
  );

  return (
    <section
      id="scent-moments"
      ref={sectionScrollRef}
      className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-12 bg-white border-b border-[#EDE8E0]"
      style={{ "--wipe": "1", "--cards-p": "0" } as React.CSSProperties}
    >
      <div className="mx-auto max-w-7xl">
        
        {/* Section Header: Scroll-Linked Light-Sweep Color Wipe across Title */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12 sm:mb-16">
          <div className="relative p-1 -m-1">
            {/* Underlay muted warm text */}
            <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-black text-[#C4BCB2] tracking-tight select-none">
              {headlineBase}
            </h2>

            {/* Overlaid vibrant lit text wiped smoothly via scroll */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 p-1 will-change-[clip-path]"
              style={{
                clipPath: isArabic
                  ? "inset(0 0 0 calc((1 - var(--wipe, 1)) * 100%))"
                  : "inset(0 calc((1 - var(--wipe, 1)) * 100%) 0 0)"
              }}
            >
              <span className="block font-editorial text-4xl sm:text-5xl lg:text-6xl font-black text-[#1C1917] tracking-tight">
                {headlineLit}
              </span>
            </div>
          </div>

          <Link
            href="#collection"
            className="group inline-flex items-center gap-2 text-sm font-medium text-[#1C1917] hover:text-[#B85A2D] transition-colors"
          >
            <span>{dict.findYourMoment || (isArabic ? "استكشف لحظتك" : "Find your moment")}</span>
            <ArrowRight size={15} className={`transition-transform group-hover:translate-x-1 ${isArabic ? "rotate-180 group-hover:-translate-x-1" : ""}`} />
          </Link>
        </div>

        {/* 3 Editorial Product Cards: Horizontal Snap Shelf on Mobile, 3-Col Grid on Desktop */}
        <div
          ref={cardsRef}
          className="flex md:grid md:grid-cols-3 gap-5 md:gap-8 lg:gap-10 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none no-scrollbar -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0 scroll-px-4 sm:scroll-px-6 pb-2 md:pb-0"
        >
          {items.map((item, idx) => {
            const isAdded = addedId === item.id;
            const isAdding = addingId === item.id;
            const title = isArabic ? item.nameAr : item.nameEn;
            const notes = isArabic ? item.notesAr : item.notesEn;
            const delayMs = idx * 140;

            return (
              <div
                key={item.id}
                className={`group flex flex-col shrink-0 w-[78vw] max-w-[330px] sm:w-[46vw] sm:max-w-none md:w-auto snap-start md:snap-align-none md:will-change-transform ${
                  idx === 1 ? "md:[transform:translate3d(0,calc(var(--cards-p,0)*-28px),0)]" : ""
                }`}
              >
                {/* Photo Card with Vertical Curtain Clip-Path Reveal & Image Reverse Zoom */}
                <Link
                  href={`/products/${item.slug}`}
                  className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[#EBE5DA] shadow-sm transition-[clip-path,opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{
                    clipPath: cardsInView ? "inset(0% 0% 0% 0% round 16px)" : "inset(14% 0% 0% 0% round 16px)",
                    opacity: cardsInView ? 1 : 0,
                    transform: cardsInView ? "translateY(0)" : "translateY(20px)",
                    transitionDelay: `${delayMs}ms`
                  }}
                >
                  <Image
                    alt={title}
                    src={item.image}
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 95vw"
                    className={`object-cover object-center transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 ${
                      cardsInView ? "scale-100" : "scale-110"
                    }`}
                    style={{ transitionDelay: `${delayMs}ms` }}
                  />
                </Link>

                {/* Metadata & Button reveal right after photo */}
                <div
                  className="transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{
                    opacity: cardsInView ? 1 : 0,
                    transform: cardsInView ? "translateY(0)" : "translateY(14px)",
                    transitionDelay: `${delayMs + 120}ms`
                  }}
                >
                  <div className="mt-5 flex items-baseline justify-between gap-3">
                    <Link
                      href={`/products/${item.slug}`}
                      className="font-editorial text-2xl lg:text-3xl font-bold text-[#1C1917] hover:text-[#B85A2D] transition-colors"
                    >
                      {title}
                    </Link>
                    <span className="font-light text-base text-[#1C1917] shrink-0">
                      {formatMoney(item.price, "EGP", locale)}
                    </span>
                  </div>

                  <p className="mt-1.5 text-xs sm:text-sm text-[#78716C] font-light line-clamp-2">
                    {notes}
                  </p>

                  <div className="mt-5">
                    {item.requiresOptions ? (
                      <Link
                        href={`/products/${item.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#D7CCBD] bg-white/80 px-5 py-2.5 text-xs font-medium text-[#1C1917] transition-all duration-300 hover:border-[#1C1917] hover:bg-[#1C1917] hover:text-white active:scale-95"
                      >
                        <span>{dict.customize}</span>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled={isAdding || isPending}
                        onClick={() => handleAddToBag(item)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-medium transition-all duration-300 active:scale-95 ${
                          isAdded
                            ? "bg-[#1C1917] text-white border border-[#1C1917]"
                            : "border border-[#D7CCBD] bg-white/80 text-[#1C1917] hover:bg-[#1C1917] hover:text-white hover:border-[#1C1917]"
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check size={14} className="text-[#B85A2D]" />
                            <span>{dict.addedToBag || (isArabic ? "تمت الإضافة ✓" : "Added to bag")}</span>
                          </>
                        ) : (
                          <span>{dict.addToBag || (isArabic ? "أضف للحقيبة +" : "Add to bag +")}</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
