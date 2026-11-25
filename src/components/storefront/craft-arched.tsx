"use client";

import { Droplet, Flame, Sparkles, RotateCw } from "lucide-react";
import type { Locale, Dictionary } from "@/lib/i18n";
import { useInViewOnce } from "@/components/storefront/scroll-animations";

export function CraftArchedSection({
  locale,
  dict
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const isArabic = locale === "ar";
  const { ref: sectionRef, inView } = useInViewOnce<HTMLElement>(0.16);

  const pillars = [
    {
      icon: Droplet,
      title: dict.craftPillar1Title || (isArabic ? "مزيج شمع الصويا" : "Soy wax blend"),
      text:
        dict.craftPillar1Text ||
        (isArabic
          ? "شمع نباتي نقي ١٠٠٪ يحترق بنظافة وهدوء، ليبقى العطر متزناً من أول إشعال حتى آخر قطرة."
          : "Plant-based and clean burning, so the scent stays even from first light to last.")
    },
    {
      icon: Flame,
      title: dict.craftPillar2Title || (isArabic ? "فتيل قطني نقي" : "Cotton wick"),
      text:
        dict.craftPillar2Text ||
        (isArabic
          ? "خالٍ تماماً من الرصاص ومقصوص يدوياً لشعلة هادئة ثابتة وبأقل قدر من السخام."
          : "Lead-free and trimmed for a steady flame with minimal soot.")
    },
    {
      icon: Sparkles,
      title: dict.craftPillar3Title || (isArabic ? "دفعات يدوية محدودة" : "Small batches"),
      text:
        dict.craftPillar3Text ||
        (isArabic
          ? "نسكب كل شمعة يدوياً في مرسمنا بدفعات محدودة، ونفحص كل قطعة بعناية قبل التغليف."
          : "Poured by hand in limited runs and checked before shipping.")
    },
    {
      icon: RotateCw,
      title: dict.craftPillar4Title || (isArabic ? "زجاج يدوم معك" : "Reusable glass"),
      text:
        dict.craftPillar4Text ||
        (isArabic
          ? "عند انتهاء الشمعة، يتحول الوعاء الزجاجي الثقيل إلى مزهرية، أصيص نبتة، أو منظم أنيق لبيتك."
          : "When the wax is gone, the jar becomes a vase or a plant pot.")
    }
  ];

  return (
    <section
      id="craft"
      ref={sectionRef}
      className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-12 bg-[#161412] text-[#F7F4EE] border-b border-[#2A2622] overflow-hidden"
    >
      <div className="mx-auto max-w-6xl">
        
        {/* Section Header: Slow Focus Blur Reveal ("بتأنٍ") + Center-Out Bronze Rule */}
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
          <p
            className="text-[11px] uppercase tracking-[0.2em] text-[#C4956A] mb-3 font-medium transition-all duration-700 ease-out"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(10px)"
            }}
          >
            {isArabic ? "فلسفتنا الحرفية" : "OUR ATELIER CRAFT"}
          </p>

          <h2
            className="font-editorial text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight transition-[filter,opacity,transform] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[filter,transform]"
            style={{
              filter: inView ? "blur(0px)" : "blur(10px)",
              opacity: inView ? 1 : 0,
              transform: inView ? "scale(1)" : "scale(0.97)",
              transitionDelay: "90ms"
            }}
          >
            {dict.craftTitle || (isArabic ? "صُنعت بتأنٍ، صُنعت ببساطة." : "Made slowly, made simply.")}
          </h2>

          <p
            className="mt-4 text-xs sm:text-sm text-[#A89F91] leading-relaxed font-light transition-all duration-[900ms] ease-out"
            style={{
              filter: inView ? "blur(0px)" : "blur(4px)",
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(10px)",
              transitionDelay: "240ms"
            }}
          >
            {dict.craftSubtitle ||
              (isArabic
                ? "نؤمن بأن الأشياء الجميلة تأخذ وقتها. كل تفصيلة في شمعتنا صُممت لتمنحك سكينة وأصالة تدوم."
                : "We believe good things take time. Every detail is designed to bring lasting calm and beauty.")}
          </p>

          {/* Expanding center-out warm bronze accent rule */}
          <div className="mt-7 flex justify-center">
            <div
              className="h-px w-28 bg-gradient-to-r from-transparent via-[#C4956A]/70 to-transparent transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                transform: inView ? "scaleX(1)" : "scaleX(0)",
                transitionDelay: "320ms"
              }}
            />
          </div>
        </div>

        {/* 4 Pillars Grid: Icon halos ignite sequentially followed by copy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-8 divide-y sm:divide-y-0 divide-[#2A2622]">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            const baseDelay = 280 + idx * 120;

            return (
              <div key={idx} className="flex flex-col items-center text-center pt-6 sm:pt-0">
                <div
                  className="w-12 h-12 rounded-full border border-[#332E29] bg-[#221F1C] flex items-center justify-center text-[#C4956A] mb-4 shadow-sm transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{
                    opacity: inView ? 1 : 0,
                    transform: inView ? "scale(1)" : "scale(0.75)",
                    boxShadow: inView ? "0 0 24px -4px rgba(196, 149, 106, 0.25)" : "none",
                    transitionDelay: `${baseDelay}ms`
                  }}
                >
                  <Icon size={20} strokeWidth={1.5} />
                </div>

                <div
                  className="transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{
                    opacity: inView ? 1 : 0,
                    transform: inView ? "translateY(0)" : "translateY(14px)",
                    transitionDelay: `${baseDelay + 90}ms`
                  }}
                >
                  <h3 className="font-editorial text-xl sm:text-2xl font-bold text-white mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#A89F91] leading-relaxed font-light">
                    {pillar.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
