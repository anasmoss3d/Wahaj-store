"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { Locale, Dictionary } from "@/lib/i18n";
import { CountUpNumber, useScrollVars } from "@/components/storefront/scroll-animations";

export function HeroSection({
  locale,
  dict
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const isArabic = locale === "ar";

  const heroScrollRef = useScrollVars<HTMLElement>(
    (_el, rect) => {
      // 0 at top of page, progresses smoothly toward 1 as hero scrolls upward
      const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height * 0.85)));
      return {
        "--hero-p": progress.toFixed(4)
      };
    },
    { "--hero-p": "0" }
  );

  return (
    <section
      ref={heroScrollRef}
      className="relative overflow-hidden bg-[#F7F4EE] border-b border-[#E8E2D8] py-14 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-12"
      style={{ "--hero-p": "0" } as React.CSSProperties}
    >
      {/* Ambient warm light accents */}
      <div className="pointer-events-none absolute -top-24 end-1/4 h-96 w-96 rounded-full bg-[#EAD9C6]/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 start-1/3 h-80 w-80 rounded-full bg-[#E3D7C7]/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          
          {/* Text Column:
              CSS Grid naturally places the 1st item on the Right in Arabic (RTL)
              and on the Left in English (LTR).
          */}
          <div className="lg:col-span-6 flex flex-col items-start">
            
            {/* Minimal Kicker Tag */}
            <div
              className="animate-wahaj-fade-up inline-flex items-center gap-2 rounded-full border border-[#E8E2D8] bg-[#F4EFEB] px-3.5 py-1.5 mb-6 text-[11px] font-medium text-[#78716C]"
              style={{ animationDelay: "40ms" }}
            >
              <Sparkles size={13} className="text-[#B85A2D]" />
              <span className={isArabic ? "" : "uppercase tracking-[0.2em]"}>
                {isArabic ? "صُنع يدوي من شمع الصويا النقي" : "HANDMADE SOY CANDLES"}
              </span>
            </div>

            {/* Editorial Serif Headline with Masked Line-by-Line Rise */}
            <h1 className="font-editorial text-4xl sm:text-6xl lg:text-7xl font-black text-[#1C1917] tracking-tight leading-[1.16]">
              <span className="block overflow-hidden py-1 -my-1">
                <span className="animate-wahaj-line block" style={{ animationDelay: "80ms" }}>
                  {isArabic ? "السكينة التي" : "Silence you"}
                </span>
              </span>
              <span className="block overflow-hidden py-2 -my-2">
                <span className="animate-wahaj-line block" style={{ animationDelay: "200ms" }}>
                  {isArabic ? "يمكنك إشعالها" : "can light"}
                </span>
              </span>
            </h1>

            {/* Subtitle Paragraph */}
            <p
              className="animate-wahaj-fade-up mt-6 text-base sm:text-lg text-[#665E57] leading-relaxed max-w-lg font-light"
              style={{ animationDelay: "280ms" }}
            >
              {isArabic
                ? "شموع صويا طبيعية ١٠٠٪ بفتيل قطني نقي. صُبت يدوياً في دفعات صغيرة لأمسيات هادئة ودافئة في بيتك."
                : "Handmade from 100% natural soy wax with pure cotton wicks. Poured in small batches for quiet evenings at home."}
            </p>

            {/* CTA Buttons */}
            <div
              className="animate-wahaj-fade-up mt-8 sm:mt-10 flex flex-wrap items-center gap-4"
              style={{ animationDelay: "360ms" }}
            >
              <Link
                href="#collection"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#B85A2D] px-8 py-4 text-sm font-medium text-white shadow-pill transition-all duration-300 hover:bg-[#9E4A22] active:scale-[0.98]"
              >
                <span>{isArabic ? "اختر عطرك" : "Explore our scents"}</span>
                <ArrowRight size={16} className={isArabic ? "rotate-180" : ""} />
              </Link>

              <Link
                href="#craft"
                className="inline-flex items-center justify-center rounded-full border border-[#E8E2D8] bg-[#F4EFEB] px-6 py-4 text-sm font-medium text-[#1C1917] transition-all duration-300 hover:bg-[#EAE4DC]"
              >
                <span>{dict.navCraft || (isArabic ? "حرفتنا" : "Our craft")}</span>
              </Link>
            </div>

            {/* Atelier Note with Animated Count-Up Stats */}
            <div
              className="animate-wahaj-fade-up mt-12 flex items-center gap-6 pt-6 border-t border-[#E8E2D8]/70 text-xs text-[#8C827A]"
              style={{ animationDelay: "440ms" }}
            >
              <div>
                <span className="font-editorial text-lg text-[#1C1917] font-bold block">
                  <CountUpNumber target={100} arabicDigits={isArabic} suffix={isArabic ? "٪" : "%"} />
                </span>
                <span>{isArabic ? "شمع صويا نباتي" : "Soy wax blend"}</span>
              </div>
              <div className="w-px h-8 bg-[#E8E2D8]" />
              <div>
                <span className="font-editorial text-lg text-[#1C1917] font-bold block">
                  <CountUpNumber target={50} arabicDigits={isArabic} prefix="+" />
                </span>
                <span>{isArabic ? "ساعة احتراق نقي" : "Hours clean burn"}</span>
              </div>
              <div className="w-px h-8 bg-[#E8E2D8]" />
              <div>
                <span className="font-editorial text-lg text-[#1C1917] font-bold block">
                  {isArabic ? "دفعات صغيرة" : "Atelier"}
                </span>
                <span>{isArabic ? "سكب يدوي متقن" : "Hand-poured runs"}</span>
              </div>
            </div>

          </div>

          {/* Candle Staging Column with Scroll-Linked Parallax & Halo */}
          <div className="lg:col-span-6 flex items-center justify-center">
            <div
              className="animate-wahaj-fade-up relative w-full max-w-lg lg:max-w-none flex items-center justify-center py-6"
              style={{ animationDelay: "180ms" }}
            >
              {/* Luminous warm ambient lighting halo expanding gently on scroll */}
              <div
                className="pointer-events-none absolute h-80 w-80 rounded-full bg-[#EBD8C3]/55 blur-3xl -z-10 will-change-transform"
                style={{
                  transform: "scale(calc(1 + var(--hero-p, 0) * 0.28))",
                  opacity: "calc(0.85 + var(--hero-p, 0) * 0.15)"
                }}
              />

              {/* Seamless Candle Composition with authentic depth and scroll parallax */}
              <div className="relative w-full max-w-lg lg:max-w-[540px] aspect-[7/6] flex items-center justify-center">
                
                {/* Organic ground contact shadows aligned cleanly under the stone slab */}
                <div
                  className="pointer-events-none absolute bottom-3 sm:bottom-4 w-3/4 h-7 bg-[#2A231D]/16 blur-xl rounded-[100%] will-change-transform"
                  style={{
                    transform: "scaleX(calc(1 + var(--hero-p, 0) * 0.22))",
                    opacity: "calc(1 - var(--hero-p, 0) * 0.45)"
                  }}
                />
                <div
                  className="pointer-events-none absolute bottom-4 sm:bottom-5 w-1/2 h-3.5 bg-[#1F1914]/22 blur-md rounded-[100%] will-change-transform"
                  style={{
                    transform: "scaleX(calc(1 + var(--hero-p, 0) * 0.15))",
                    opacity: "calc(1 - var(--hero-p, 0) * 0.5)"
                  }}
                />

                <div
                  className="relative z-10 transition-transform duration-700 hover:scale-[1.02] will-change-transform"
                  style={{
                    transform: "translate3d(0, calc(var(--hero-p, 0) * -42px), 0)"
                  }}
                >
                  <Image
                    alt={isArabic ? "شمعة وهج بخشب الصندل على قاعدة حجرية مع زهور وأخشاب" : "Wahaj Sandalwood handmade candle on natural stone with botanicals"}
                    src="/brand/hero-candle-isolated.webp"
                    width={700}
                    height={626}
                    priority
                    unoptimized
                    sizes="(min-width: 1024px) 48vw, 92vw"
                    className="max-h-[400px] sm:max-h-[450px] lg:max-h-[520px] w-auto object-contain drop-shadow-[0_18px_32px_rgba(25,22,20,0.10)]"
                  />
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
