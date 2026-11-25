"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { Locale, Dictionary } from "@/lib/i18n";
import { useInViewOnce, useScrollVars } from "@/components/storefront/scroll-animations";

export function NewsletterGlow({
  locale,
  dict
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const isArabic = locale === "ar";
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { ref: inViewRef, inView } = useInViewOnce<HTMLDivElement>(0.18);

  // Scroll-linked subtle expansion of the celadon newsletter container
  const scrollRef = useScrollVars<HTMLElement>(
    (_el, rect, viewportH) => {
      const p = Math.min(1, Math.max(0, (viewportH * 0.95 - rect.top) / (viewportH * 0.42)));
      return {
        "--card-p": p.toFixed(4)
      };
    },
    { "--card-p": "1" }
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setEmail("");
    }
  }

  return (
    <section
      ref={scrollRef}
      className="py-12 sm:py-16 px-4 sm:px-6 lg:px-12 bg-[#F7F4EE] overflow-hidden"
      style={{ "--card-p": "1" } as React.CSSProperties}
    >
      <div ref={inViewRef} className="mx-auto max-w-4xl">
        
        {/* Soft Sage / Celadon Container expanding subtly on scroll */}
        <div
          className="rounded-[32px] sm:rounded-[40px] bg-[#D7DDD4] px-6 py-16 sm:px-12 sm:py-20 text-center shadow-sm will-change-transform"
          style={{
            transform: "scale(calc(0.93 + var(--card-p, 1) * 0.07))"
          }}
        >
          
          {/* Headline matching Reference Image 4: "Bring a little glow home." */}
          <h2
            className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-black text-[#1C1917] tracking-tight mb-4 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(16px)"
            }}
          >
            {dict.newsletterTitle || (isArabic ? "أضف قبساً من الدفء لبيتك." : "Bring a little glow home.")}
          </h2>

          {/* Subtitle */}
          <p
            className="text-xs sm:text-sm text-[#57534E] max-w-md mx-auto leading-relaxed mb-8 font-light transition-all duration-700 ease-out"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(14px)",
              transitionDelay: "100ms"
            }}
          >
            {dict.newsletterSubtitle ||
              (isArabic
                ? "انضم لقائمتنا لتصلك أحدث العطور الحصرية ومواعيد التوفر. شحن مجاني للطلبات فوق 500 ج.م."
                : "Join the list for new scents and restock news. Free shipping on orders over 500 EGP.")}
          </p>

          {/* Form: White Pill Input + Terracotta Pill Button */}
          <div
            className="transition-all duration-700 ease-out"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(16px)",
              transitionDelay: "180ms"
            }}
          >
            {submitted ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-medium text-[#1C1917] shadow-sm">
                <Check size={16} className="text-[#B85A2D]" />
                <span>{dict.newsletterSuccess || (isArabic ? "مرحباً بك في وهج." : "Welcome to Wahaj.")}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={dict.newsletterPlaceholder || "you@example.com"}
                  className="h-12 w-full sm:w-72 rounded-full border border-white/80 bg-white px-5 text-sm text-[#1C1917] placeholder:text-[#A8A29E] outline-none shadow-sm transition-all focus:ring-2 focus:ring-[#B85A2D]/20 focus:border-[#B85A2D]"
                />
                <button
                  type="submit"
                  className="h-12 w-full sm:w-auto shrink-0 rounded-full bg-[#B85A2D] px-8 text-sm font-medium text-white shadow-pill transition-all duration-300 hover:bg-[#9E4A22] active:scale-[0.98]"
                >
                  {dict.newsletterButton || (isArabic ? "اشترك الآن" : "Join the list")}
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </section>
  );
}
