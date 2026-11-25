"use client";

import { useState } from "react";
import {
  AlertCircle,
  Baby,
  Clock,
  DropletOff,
  Flame,
  Heart,
  Home,
  Plus,
  Scissors,
  Wind
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const CARE_ITEMS = [
  {
    icon: Scissors,
    ar: "قصّي الفتيل إلى حوالي 5 مم قبل كل استخدام.",
    en: "Trim the wick to about 5 mm before each use."
  },
  {
    icon: Clock,
    ar: "أول استخدام: اتركي الشمعة حتى يذوب سطح الشمع بالكامل قدر الإمكان لتجنب تكون نفق في المنتصف.",
    en: "First burn: allow the wax surface to melt completely across the top to prevent tunneling."
  },
  {
    icon: Wind,
    ar: "تجنبي تيارات الهواء والمراوح.",
    en: "Keep away from drafts, fans, and air currents."
  },
  {
    icon: Flame,
    ar: "لا تتركي الشمعة مشتعلة لأكثر من 3-4 ساعات متواصلة.",
    en: "Do not burn the candle for more than 3–4 hours at a time."
  },
  {
    icon: Baby,
    ar: "لا تتركي الشمعة دون مراقبة أو بالقرب من الأطفال والحيوانات الأليفة.",
    en: "Never leave a burning candle unattended or within reach of children and pets."
  },
  {
    icon: Home,
    ar: "ضعيها على سطح ثابت ومقاوم للحرارة وبعيداً عن أي مواد قابلة للاشتعال.",
    en: "Place on a stable, heat-resistant surface away from any flammable materials."
  },
  {
    icon: DropletOff,
    ar: "لا تستخدمي الماء لإطفائها، واتركي الشمع يبرد قبل لمس العبوة أو نقلها.",
    en: "Never use water to extinguish, and let the wax cool before touching or moving the jar."
  },
  {
    icon: AlertCircle,
    ar: "توقفي عن الاستخدام عندما يتبقى حوالي 1 سم من الشمع في قاع العبوة.",
    en: "Discontinue use when about 1 cm of wax remains at the bottom of the jar."
  }
] as const;

export function CandleCareInstructions({ locale }: { locale: Locale }) {
  const isArabic = locale === "ar";
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section
      aria-labelledby="candle-care-heading"
      className="mt-8 rounded-2xl border border-[#E5DDD0] bg-[#FAF8F5] transition-all duration-300"
    >
      <button
        id="candle-care-heading"
        type="button"
        aria-expanded={isOpen}
        aria-controls="candle-care-panel"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 rounded-2xl p-5 sm:p-7 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B85A2D]/25"
      >
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#E5DDD0] bg-[#F2ECE4] text-[#B85A2D]">
            <Flame size={20} />
          </span>
          <div className="min-w-0">
            <p
              className={cn(
                "text-[11px] font-medium text-[#8C7A6B]",
                isArabic ? "" : "uppercase tracking-[0.2em]"
              )}
            >
              {isArabic ? "دليل السلامة والعناية · ٨ إرشادات" : "CANDLE CARE & SAFETY · 8 TIPS"}
            </p>
            <h2 className="mt-0.5 font-editorial text-xl sm:text-2xl font-black text-[#1C1917]">
              {isArabic ? "تعليمات استخدام الشموع والعناية بها" : "Candle Care & Usage Instructions"}
            </h2>
          </div>
        </div>

        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-all duration-300",
            isOpen
              ? "border-[#1C1917] bg-[#1C1917] text-white"
              : "border-[#DED6CA] bg-white text-[#8C6445] hover:border-[#B85A2D] hover:text-[#B85A2D]"
          )}
        >
          <Plus
            size={16}
            className={cn(
              "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              isOpen ? "rotate-45" : ""
            )}
          />
        </span>
      </button>

      <div
        id="candle-care-panel"
        role="region"
        aria-labelledby="candle-care-heading"
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-[#E8E2D8] px-5 pb-6 pt-5 sm:px-7 sm:pb-7">
            <div className="grid gap-3 sm:grid-cols-2">
              {CARE_ITEMS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3.5 rounded-xl border border-[#EDE8E0] bg-white p-4 shadow-[0_10px_24px_-18px_rgba(28,25,23,0.08)]"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F2ECE4] text-[#9E4A22]">
                      <Icon size={17} />
                    </span>
                    <p className="text-xs sm:text-sm leading-relaxed text-[#57534E]">
                      {isArabic ? item.ar : item.en}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-[#EDE8E0] bg-[#F2ECE4]/70 px-4 py-3 text-center">
              <span className="font-editorial text-base font-bold text-[#1C1917]">
                {isArabic ? "استمتعي بأجواء أدفأ مع وهج" : "Enjoy warmer moments with Wahaj"}
              </span>
              <Heart size={16} className="shrink-0 text-[#B85A2D]" fill="currentColor" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
