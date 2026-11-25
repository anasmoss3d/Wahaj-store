"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, MessageCircle, Plus } from "lucide-react";
import type { Locale, Dictionary } from "@/lib/i18n";
import { useInViewOnce } from "@/components/storefront/scroll-animations";

export function FaqSection({
  locale,
  dict,
  whatsappNumber = "+201000000000"
}: {
  locale: Locale;
  dict: Dictionary;
  whatsappNumber?: string;
}) {
  const isArabic = locale === "ar";
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { ref: sectionRef, inView } = useInViewOnce<HTMLElement>(0.12);

  const cleanPhone = whatsappNumber.replace(/[^\d]/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone}`;

  const items = [
    {
      num: isArabic ? "٠١" : "01",
      q: dict.faq1Q || (isArabic ? "كيف أعتني بشمعتي بالشكل الصحيح؟" : "How do I care for my candle?"),
      a:
        dict.faq1A ||
        (isArabic
          ? "احرص دائماً على قص الفتيل لحوالي نصف سنتيمتر قبل كل إشعال. في أول مرة تشعل فيها الشمعة، اترك الشمع يذوب حتى يصل لحواف الوعاء بالكامل (ساعتين إلى ٣ ساعات) لمنع تجويف الشمعة ولضمان احتراق متساوٍ ونقي."
          : "Always trim the wick to 1/4 inch before lighting. On your first burn, let the wax pool reach the edges of the jar (usually 2-3 hours) to prevent tunneling and ensure an even, clean burn.")
    },
    {
      num: isArabic ? "٠٢" : "02",
      q: dict.faq3Q || (isArabic ? "هل جميع الشموع مصنوعة من شمع صويا طبيعي؟" : "Are the candles made with soy wax?"),
      a:
        dict.faq3A ||
        (isArabic
          ? "نعم، نستخدم شمع صويا نباتي طبيعي ١٠٠٪ قابل للتحلل، وخالٍ تماماً من البارافين والمشتقات البترولية. احتراق نظيف، بطيء، وصحي لبيتك ولعائلتك."
          : "Yes, 100% pure, biodegradable plant-based soy wax. Free from paraffin, petroleum derivatives, and phthalates. It burns cleanly at lower temperatures, holding botanical scent notes longer.")
    },
    {
      num: isArabic ? "٠٣" : "03",
      q: isArabic ? "كم تدوم الشمعة وما قوة انتشار عطرها؟" : "How long do they burn and how strong is the scent?",
      a: isArabic
        ? "تمنحك كل شمعة ما يتجاوز ٥٠ ساعة من الاحتراق الهادئ. نستخدم تركيزاً مدروساً من الزيوت العطرية النقية يغمر الغرفة تدريجياً خلال دقائق بعد إشعالها دون حدة أو دخان مزعج."
        : "Each hand-poured vessel offers 50+ hours of clean burn time. Our botanical fragrance load fills medium-to-large rooms gradually within minutes without overwhelming synthetics or soot."
    },
    {
      num: isArabic ? "٠٤" : "04",
      q: dict.faq2Q || (isArabic ? "هل يمكنني إعادة استخدام الوعاء الزجاجي؟" : "Can I reuse the jar?"),
      a:
        dict.faq2A ||
        (isArabic
          ? "نعم بالتأكيد! عندما يتبقى نصف بوصة من الشمع، نظف الوعاء بالماء الدافئ والصابون. الزجاج الفاخر السميك مثالي كمزهرية زهور صغيرة، كوب مكتب أنيق، أو أصيص لنبتتك المفضلة في المنزل."
          : "Yes, absolutely! Once 1/2 inch of wax remains, soak the jar in warm soapy water to lift the remaining wax. The weighted glass tumbler makes a gorgeous water glass, desk organizer, or succulent planter.")
    },
    {
      num: isArabic ? "٠٥" : "05",
      q: dict.faq4Q || (isArabic ? "متى يصل طلبي؟ وما هي مدة الشحن؟" : "When will my order arrive?"),
      a:
        dict.faq4A ||
        (isArabic
          ? "يتم سكب كل شمعة يدوياً بعناية، وتجهيز وشحن الطلبات خلال ٢ إلى ٤ أيام عمل لجميع محافظات مصر. يتوفر الدفع عند الاستلام وكذلك عبر إنستاباي."
          : "Each batch is carefully hand-poured in small quantities. Orders ship within 2 to 4 business days across all Egypt governorates. Both Cash on Delivery and InstaPay are accepted.")
    }
  ];

  return (
    <section
      id="faq"
      ref={sectionRef}
      className="py-20 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-12 bg-[#FAF8F5] border-b border-[#E8E2D8]"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          
          {/* Editorial Sticky Left/Start Column */}
          <div
            className="lg:col-span-5 lg:sticky lg:top-28 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(18px)"
            }}
          >
            <h2 className="font-editorial text-4xl sm:text-5xl lg:text-[52px] font-black text-[#1C1917] tracking-tight leading-tight">
              {dict.faqTitle || (isArabic ? "معلومات تهمك" : "Good to know")}
            </h2>

            <p className="mt-4 text-sm sm:text-base text-[#665E57] leading-relaxed font-light max-w-md">
              {dict.faqSubtitle ||
                (isArabic
                  ? "كل ما تحتاج معرفته عن جودة شمعنا، عنايتك بالشمعة، وتوصيل طلبك."
                  : "Thoughtful details about our craft, wax, and caring for your candle.")}
            </p>

            {/* Concierge / Support Card */}
            <div className="mt-8 rounded-3xl border border-[#E5DDD0] bg-[#F2ECE4]/75 p-6 shadow-sm">
              <p className="font-editorial text-lg font-bold text-[#1C1917]">
                {isArabic ? "هل لديك استفسار خاص أو طلب هدايا؟" : "Looking for custom scents or gifting?"}
              </p>
              <p className="mt-1.5 text-xs sm:text-sm text-[#665E57] leading-relaxed font-light">
                {isArabic
                  ? "فريقنا متاح للرد على أسئلتك وترتيب تغليف الهدايا أو طلبات المناسبات مباشرة."
                  : "Message our studio team directly for scent pairing advice or bespoke gift sets."}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#1C1917] px-5 py-2.5 text-xs font-medium text-white shadow-sm transition-all duration-300 hover:bg-[#B85A2D] active:scale-[0.98]"
                >
                  <MessageCircle size={14} className="text-[#E5A776]" />
                  <span>{dict.whatsapp || (isArabic ? "تواصل عبر واتساب" : "Chat on WhatsApp")}</span>
                </a>

                <Link
                  href="/orders"
                  className="inline-flex items-center gap-1 rounded-full border border-[#D8CEBF] bg-white/80 px-4 py-2.5 text-xs font-medium text-[#1C1917] transition-colors hover:bg-white hover:border-[#B85A2D]"
                >
                  <span>{dict.trackOrder || (isArabic ? "تتبع طلبك" : "Track order")}</span>
                  <ArrowUpRight size={13} className={isArabic ? "-scale-x-100" : ""} />
                </Link>
              </div>
            </div>
          </div>

          {/* Interactive Numbered Accordion Cards */}
          <div className="lg:col-span-7 space-y-3.5">
            {items.map((item, idx) => {
              const isOpen = openIndex === idx;
              const panelId = `faq-panel-${idx}`;
              const triggerId = `faq-trigger-${idx}`;
              const cardDelay = 80 + idx * 75;

              return (
                <div
                  key={idx}
                  className={`group rounded-2xl border transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isOpen
                      ? "bg-white border-[#CBB8A2]/70 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.14)]"
                      : "bg-white/60 border-[#E6DFD3] hover:bg-white/90 hover:border-[#D4C8B8]"
                  }`}
                  style={{
                    opacity: inView ? 1 : 0,
                    transform: inView ? "translateY(0)" : "translateY(16px)",
                    transitionDelay: `${cardDelay}ms`
                  }}
                >
                  <button
                    id={triggerId}
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full px-5 sm:px-7 py-5 sm:py-6 flex items-center justify-between gap-4 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B85A2D]/25 rounded-2xl"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                  >
                    <div className="flex items-baseline gap-3.5 sm:gap-4 min-w-0">
                      <span
                        className={`font-editorial text-sm sm:text-base font-black shrink-0 transition-colors duration-300 ${
                          isOpen ? "text-[#B85A2D]" : "text-[#A39689] group-hover:text-[#78716C]"
                        }`}
                      >
                        {item.num}
                      </span>
                      <span
                        className={`font-editorial text-lg sm:text-xl lg:text-[22px] font-bold transition-colors duration-300 ${
                          isOpen ? "text-[#1C1917]" : "text-[#292524] group-hover:text-[#B85A2D]"
                        }`}
                      >
                        {item.q}
                      </span>
                    </div>

                    {/* Circular Animated + / × Indicator */}
                    <span
                      className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 ${
                        isOpen
                          ? "bg-[#1C1917] border-[#1C1917] text-white"
                          : "bg-[#FAF8F5] border-[#DED6CA] text-[#8C6445] group-hover:border-[#B85A2D] group-hover:text-[#B85A2D]"
                      }`}
                    >
                      <Plus
                        size={16}
                        className={`transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                          isOpen ? "rotate-45" : ""
                        }`}
                      />
                    </span>
                  </button>

                  {/* Silky Grid-Row Accordion Answer Reveal */}
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={triggerId}
                    className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-5 sm:px-7 pb-6 pt-4 ps-12 sm:ps-14 text-xs sm:text-sm text-[#57534E] leading-relaxed font-light border-t border-[#F0EAE0]/70 mt-0.5">
                        {item.a}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
