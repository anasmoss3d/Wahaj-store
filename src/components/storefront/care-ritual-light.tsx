"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Locale, Dictionary } from "@/lib/i18n";
import { usePrefersReducedMotion } from "@/components/storefront/scroll-animations";

export function CareRitualLight({
  locale,
  dict
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const isArabic = locale === "ar";
  const reducedMotion = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const uid = useId().replace(/:/g, "");

  const [inView, setInView] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const manualLockRef = useRef(false);
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const steps = [
    {
      num: isArabic ? "٠١" : "01",
      metric: isArabic ? "٥ مم قبل كل إشعال" : "0.5 cm before lighting",
      title: dict.ritualStep1Title || (isArabic ? "قص الفتيل" : "Trim the wick"),
      text:
        dict.ritualStep1Text ||
        (isArabic
          ? "احرص على قص الفتيل لحوالي نصف سنتيمتر قبل كل إشعال لتجنب الدخان الزائد ولضمان شعلة نقية ومستقرة."
          : "Keep the cotton wick trimmed to a quarter inch before every lighting for a clean, steady flame.")
    },
    {
      num: isArabic ? "٠٢" : "02",
      metric: isArabic ? "٢ – ٣ ساعات لأول احتراق" : "2 – 3 hrs first burn",
      title: dict.ritualStep2Title || (isArabic ? "اترك أول احتراق يكتمل" : "Let the first burn go long"),
      text:
        dict.ritualStep2Text ||
        (isArabic
          ? "اترك الشمعة حتى تذوب الطبقة السطحية بالكامل وتصل لحواف الوعاء لتفادي حفر الوسط وضمان احتراق متساوٍ."
          : "Allow the wax pool to melt all the way to the glass edges on the first lighting to prevent tunneling.")
    },
    {
      num: isArabic ? "٠٣" : "03",
      metric: isArabic ? "إضاءة خافتة وهدوء تام" : "Dim lights · pure calm",
      title: dict.ritualStep3Title || (isArabic ? "استرخِ في السكينة" : "Settle in"),
      text:
        dict.ritualStep3Text ||
        (isArabic
          ? "اخفض الأضواء، ضع هاتفك جانباً، ودع النغمات العطرية الدافئة تملأ المساحة بالسكينة والهدوء."
          : "Dim the room lights, set your phone aside, and let the botanical warmth quiet the evening.")
    }
  ];

  // Reveal section cleanly as soon as it enters viewport, and lock step switching
  // until the section itself occupies the full viewport (rect.top <= 0 on desktop).
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (reducedMotion) {
      const id = window.requestAnimationFrame(() => setInView(true));
      return () => window.cancelAnimationFrame(id);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0, rootMargin: "0px 0px 80px 0px" }
    );
    observer.observe(section);

    let rafId = 0;

    const updateOnScroll = () => {
      rafId = 0;
      if (manualLockRef.current) return;

      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight || 900;
      const isDesktop = window.innerWidth >= 1024;

      let progress = 0;

      if (isDesktop && rect.height > vh + 120) {
        // Sticky locks at top: 0 -> progress stays 0 until rect.top <= 0
        // (so zero previous-section content remains visible when steps advance).
        const scrollable = Math.max(1, rect.height - vh);
        const passed = Math.max(0, -rect.top);
        progress = Math.min(1, passed / scrollable);
      } else {
        // Non-sticky fallback: begin switching only once section reaches upper viewport
        progress = Math.min(1, Math.max(0, (vh * 0.12 - rect.top) / Math.max(1, rect.height * 0.52)));
      }

      const nextIndex = progress < 0.28 ? 0 : progress < 0.66 ? 1 : 2;
      setActiveStep((prev) => (prev === nextIndex ? prev : nextIndex));
    };

    const schedule = () => {
      if (!rafId) rafId = window.requestAnimationFrame(updateOnScroll);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      observer.disconnect();
      if (rafId) window.cancelAnimationFrame(rafId);
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [reducedMotion]);

  function handleSelectStep(idx: number) {
    setActiveStep(idx);
    manualLockRef.current = true;
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    lockTimerRef.current = setTimeout(() => {
      manualLockRef.current = false;
    }, 4500);
  }

  const isDimmedEvening = activeStep === 2;
  const isLit = activeStep >= 1;
  const isMeltPoolFull = activeStep >= 1;
  const isWickTrimmed = activeStep >= 1;

  return (
    <section
      id="care"
      ref={sectionRef}
      className="relative py-16 sm:py-20 lg:py-0 lg:min-h-[210vh] px-4 sm:px-6 lg:px-12 bg-[#F2ECE4] border-b border-[#E0D7CB] overflow-x-clip"
    >
      {/* Scoped organic candle physics keyframes */}
      <style>{`
        @keyframes wahajFlameSway {
          0%, 100% { transform: rotate(-1.6deg) scaleX(0.985) scaleY(1.015); }
          25% { transform: rotate(1.2deg) scaleX(1.02) scaleY(0.985); }
          50% { transform: rotate(-0.8deg) scaleX(0.99) scaleY(1.03); }
          75% { transform: rotate(1.8deg) scaleX(1.015) scaleY(0.99); }
        }
        @keyframes wahajCoreBreath {
          0%, 100% { transform: scaleY(1) translateY(0px); opacity: 0.96; }
          40% { transform: scaleY(1.05) translateY(-1px); opacity: 1; }
          70% { transform: scaleY(0.96) translateY(0.5px); opacity: 0.92; }
        }
        @keyframes wahajHaloPulse {
          0%, 100% { transform: scale(0.96); opacity: 0.85; }
          50% { transform: scale(1.06); opacity: 1; }
        }
        @keyframes wahajPoolShimmer {
          0%, 100% { opacity: 0.65; transform: scaleX(0.96); }
          50% { opacity: 0.95; transform: scaleX(1.05); }
        }
        @keyframes wahajAromaRise {
          0% { transform: translateY(10px) translateX(0px) scale(0.9); opacity: 0; }
          25% { opacity: 0.38; }
          70% { opacity: 0.22; }
          100% { transform: translateY(-28px) translateX(5px) scale(1.12); opacity: 0; }
        }
        @keyframes wahajCutPulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.28); opacity: 0.45; }
        }
        .wahaj-flame-sway {
          transform-origin: 150px 137px;
          animation: wahajFlameSway 3.1s ease-in-out infinite;
        }
        .wahaj-core-breath {
          transform-origin: 150px 134px;
          animation: wahajCoreBreath 2.2s ease-in-out infinite;
        }
        .wahaj-halo-pulse {
          transform-origin: 150px 110px;
          animation: wahajHaloPulse 2.8s ease-in-out infinite;
        }
        .wahaj-pool-shimmer {
          transform-origin: 150px 154px;
          animation: wahajPoolShimmer 2.6s ease-in-out infinite;
        }
        .wahaj-aroma-1 {
          animation: wahajAromaRise 5.2s ease-in-out infinite;
        }
        .wahaj-aroma-2 {
          animation: wahajAromaRise 6.4s ease-in-out 2.1s infinite;
        }
        .wahaj-cut-pulse {
          transform-origin: 150px 138px;
          animation: wahajCutPulse 2s ease-in-out infinite;
        }
      `}</style>

      <div className="mx-auto max-w-6xl lg:sticky lg:top-0 lg:min-h-screen lg:pt-20 lg:pb-6 lg:flex lg:flex-col lg:justify-center">
        {/* Section Header: Single-line crisp title so section fits comfortably within 100vh */}
        <div
          className="text-center max-w-4xl mx-auto mb-8 sm:mb-10 transition-all duration-700 ease-out"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(16px)"
          }}
        >
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#8C7A6B] mb-2 font-medium">
            {isArabic ? "دليل العناية بالشموع" : "CANDLE CARE RITUAL"}
          </p>
          <h2 className="font-editorial text-3xl sm:text-4xl lg:text-[44px] xl:text-5xl lg:whitespace-nowrap font-black text-[#1C1917] tracking-tight">
            {isArabic ? "ثلاث خطوات لاحتراق أفضل" : "A better burn, in three steps"}
          </h2>
        </div>

        {/* Interactive Split Ritual Stage: Editorial Steps + Animated Candle Vessel Simulation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Editorial Stepped Sequence with Live Vertical Progress Wick */}
          <div className="lg:col-span-7 relative">
            {/* Vertical progress rail along start side */}
            <div className="absolute top-6 bottom-6 start-5 sm:start-6 w-px bg-[#DCD3C6] pointer-events-none">
              <div
                className="w-full bg-[#B85A2D] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  height: activeStep === 0 ? "33%" : activeStep === 1 ? "66%" : "100%"
                }}
              />
            </div>

            <div className="space-y-3 sm:space-y-3.5">
              {steps.map((step, idx) => {
                const isActive = activeStep === idx;
                const delay = idx * 70;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectStep(idx)}
                    aria-pressed={isActive}
                    className={`group relative w-full text-start ps-14 sm:ps-16 pe-5 py-4 sm:py-5 rounded-3xl border transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isActive
                        ? "bg-white/90 border-[#D9CCBC] shadow-[0_14px_34px_-14px_rgba(28,25,23,0.12)]"
                        : "bg-white/35 border-transparent hover:bg-white/60 hover:border-[#E4DCD0]"
                    }`}
                    style={{
                      opacity: inView ? (isActive ? 1 : 0.68) : 0,
                      transform: inView ? "translateY(0)" : "translateY(18px)",
                      transitionDelay: `${delay}ms`
                    }}
                  >
                    {/* Live Node Marker on the vertical wick rail */}
                    <span
                      className={`absolute top-6 sm:top-7 start-[15px] sm:start-[19px] h-3 w-3 rounded-full border-2 transition-all duration-500 ${
                        isActive
                          ? "scale-125 border-[#B85A2D] bg-[#B85A2D] shadow-[0_0_0_5px_rgba(184,90,45,0.16)]"
                          : idx < activeStep
                          ? "border-[#B85A2D] bg-[#F2ECE4]"
                          : "border-[#CBBFAD] bg-[#F2ECE4]"
                      }`}
                    />

                    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1.5">
                      <div className="flex items-baseline gap-3">
                        <span
                          className={`font-editorial text-xl sm:text-2xl font-black transition-colors duration-300 ${
                            isActive ? "text-[#B85A2D]" : "text-[#9C8D7E]"
                          }`}
                        >
                          {step.num}
                        </span>
                        <h3 className="font-editorial text-xl sm:text-2xl font-bold text-[#1C1917]">
                          {step.title}
                        </h3>
                      </div>

                      <span
                        className={`text-[11px] font-medium px-3 py-1 rounded-full transition-colors duration-300 ${
                          isActive
                            ? "bg-[#EFE6DA] text-[#9E4A22]"
                            : "bg-[#EAE2D6]/70 text-[#78716C]"
                        }`}
                      >
                        {step.metric}
                      </span>
                    </div>

                    <p
                      className={`text-xs sm:text-sm leading-relaxed font-light transition-all duration-500 ${
                        isActive ? "text-[#57534E]" : "text-[#78716C]"
                      }`}
                    >
                      {step.text}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sculptural Interactive Candle Burn Stage */}
          <div
            className="lg:col-span-5 transition-all duration-700 ease-out"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(18px)",
              transitionDelay: "60ms"
            }}
          >
            <div
              className={`relative aspect-[5/6] max-w-[360px] xl:max-w-[390px] mx-auto rounded-[32px] border p-5 sm:p-6 flex flex-col items-center justify-between overflow-hidden transition-colors duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] shadow-sm ${
                isDimmedEvening
                  ? "bg-[#14110F] border-[#2C241F] text-[#F7F4EE]"
                  : "bg-[#FAF8F5] border-[#E4DDD2] text-[#1C1917]"
              }`}
            >
              {/* Atmospheric room bloom expanding in lit & evening modes */}
              <div
                className="pointer-events-none absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-all duration-1000"
                style={{
                  width: isDimmedEvening ? "340px" : isLit ? "230px" : "120px",
                  height: isDimmedEvening ? "340px" : isLit ? "230px" : "120px",
                  opacity: isDimmedEvening ? 1 : isLit ? 0.75 : 0.25,
                  background: isDimmedEvening
                    ? "radial-gradient(circle, rgba(255,168,76,0.44) 0%, rgba(196,98,38,0.18) 48%, transparent 74%)"
                    : "radial-gradient(circle, rgba(235,175,105,0.34) 0%, rgba(212,138,72,0.08) 55%, transparent 75%)"
                }}
              />

              {/* Subtle tabletop horizon gradient */}
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-28 transition-opacity duration-1000"
                style={{
                  background: isDimmedEvening
                    ? "linear-gradient(to top, rgba(8,6,5,0.82), rgba(20,17,15,0))"
                    : "linear-gradient(to top, rgba(232,223,210,0.55), rgba(250,248,245,0))"
                }}
              />

              {/* Top Stage Readout Pill */}
              <div className="relative z-10 flex items-center justify-between w-full text-[11px]">
                <span
                  className={`font-medium tracking-wider transition-colors duration-500 ${
                    isDimmedEvening ? "text-[#D4A276]" : "text-[#8C7A6B]"
                  }`}
                >
                  {isArabic ? `المرحلة ${steps[activeStep].num}` : `STEP ${steps[activeStep].num}`}
                </span>
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      aria-label={`Step ${dotIdx + 1}`}
                      onClick={() => handleSelectStep(dotIdx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        activeStep === dotIdx
                          ? "w-5 bg-[#B85A2D]"
                          : isDimmedEvening
                          ? "w-1.5 bg-white/25 hover:bg-white/50"
                          : "w-1.5 bg-[#D4C9BA] hover:bg-[#B85A2D]/50"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Photorealistic 3D Cylindrical SVG Candle Vessel */}
              <div className="relative z-10 flex items-center justify-center w-full my-auto py-1">
                <svg
                  viewBox="0 0 300 336"
                  className="w-56 sm:w-60 xl:w-[252px] h-auto overflow-visible select-none"
                  aria-hidden
                >
                  <defs>
                    {/* Blur Filters */}
                    <filter id={`${uid}-softGlow`} x="-60%" y="-60%" width="220%" height="220%">
                      <feGaussianBlur stdDeviation="14" />
                    </filter>
                    <filter id={`${uid}-medGlow`} x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="5.5" />
                    </filter>
                    <filter id={`${uid}-tightBlur`} x="-40%" y="-40%" width="180%" height="180%">
                      <feGaussianBlur stdDeviation="2.2" />
                    </filter>
                    <filter id={`${uid}-shadowBlur`} x="-40%" y="-40%" width="180%" height="180%">
                      <feGaussianBlur stdDeviation="7" />
                    </filter>
                    <filter id={`${uid}-blueBlur`} x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="1.8" />
                    </filter>

                    {/* Tabletop Shadow & Caustic Pool */}
                    <radialGradient id={`${uid}-tableShadow`} cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#140F0C" stopOpacity={isDimmedEvening ? 0.85 : 0.34} />
                      <stop offset="62%" stopColor="#1C1510" stopOpacity={isDimmedEvening ? 0.45 : 0.14} />
                      <stop offset="100%" stopColor="#1C1510" stopOpacity="0" />
                    </radialGradient>

                    <radialGradient id={`${uid}-tableCaustic`} cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#FFB866" stopOpacity={isDimmedEvening ? 0.34 : 0.12} />
                      <stop offset="55%" stopColor="#D97B34" stopOpacity={isDimmedEvening ? 0.16 : 0.04} />
                      <stop offset="100%" stopColor="#B85A2D" stopOpacity="0" />
                    </radialGradient>

                    {/* Cylindrical Solid Soy Wax Shading (Day vs Evening) */}
                    <linearGradient id={`${uid}-waxBodyDay`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#DDD3C5" />
                      <stop offset="18%" stopColor="#F4EFE6" />
                      <stop offset="48%" stopColor="#FAF6EE" />
                      <stop offset="82%" stopColor="#EAE0D1" />
                      <stop offset="100%" stopColor="#CFC3B2" />
                    </linearGradient>

                    <linearGradient id={`${uid}-waxBodyNight`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3D3129" />
                      <stop offset="20%" stopColor="#6B5647" />
                      <stop offset="50%" stopColor="#7D6553" />
                      <stop offset="80%" stopColor="#584639" />
                      <stop offset="100%" stopColor="#2E241E" />
                    </linearGradient>

                    {/* Subsurface Scattering Warm Wax Internal Glow */}
                    <radialGradient id={`${uid}-waxSSS`} cx="50%" cy="6%" r="78%" fx="50%" fy="2%">
                      <stop offset="0%" stopColor="#FFF0C2" stopOpacity="0.95" />
                      <stop offset="22%" stopColor="#F5B25B" stopOpacity="0.78" />
                      <stop offset="52%" stopColor="#C86D2B" stopOpacity="0.34" />
                      <stop offset="85%" stopColor="#7A3614" stopOpacity="0.06" />
                      <stop offset="100%" stopColor="#7A3614" stopOpacity="0" />
                    </radialGradient>

                    {/* Unmelted Wax Top Surface (Matte Cream with subtle cooling dip) */}
                    <radialGradient id={`${uid}-waxTopSolid`} cx="50%" cy="48%" r="55%">
                      <stop offset="0%" stopColor={isDimmedEvening ? "#8A715D" : "#E5DBCC"} />
                      <stop offset="45%" stopColor={isDimmedEvening ? "#6D5848" : "#F3ECE0"} />
                      <stop offset="88%" stopColor={isDimmedEvening ? "#564437" : "#E6DCCD"} />
                      <stop offset="100%" stopColor={isDimmedEvening ? "#3E3026" : "#CFC2B0"} />
                    </radialGradient>

                    {/* Liquid Wax Melt Pool (Glossy Translucent Warm Honey) */}
                    <radialGradient id={`${uid}-meltPoolGrad`} cx="50%" cy="46%" r="54%">
                      <stop offset="0%" stopColor="#FFF7DB" stopOpacity="0.98" />
                      <stop offset="26%" stopColor="#F6C87E" stopOpacity="0.95" />
                      <stop offset="62%" stopColor={isDimmedEvening ? "#C98542" : "#DFB680"} stopOpacity="0.92" />
                      <stop offset="92%" stopColor={isDimmedEvening ? "#8E5122" : "#C59865"} stopOpacity="0.96" />
                      <stop offset="100%" stopColor={isDimmedEvening ? "#5E3213" : "#A97D4F"} stopOpacity="0.98" />
                    </radialGradient>

                    {/* Inner Back Glass Wall Shading */}
                    <linearGradient id={`${uid}-glassBackWall`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={isDimmedEvening ? "#FFFFFF" : "#BCAE9E"} stopOpacity={isDimmedEvening ? 0.14 : 0.28} />
                      <stop offset="25%" stopColor={isDimmedEvening ? "#FFD9A6" : "#FFFFFF"} stopOpacity={isDimmedEvening ? 0.06 : 0.14} />
                      <stop offset="50%" stopColor={isDimmedEvening ? "#FFE6BD" : "#F7F2EA"} stopOpacity={isDimmedEvening ? 0.12 : 0.08} />
                      <stop offset="75%" stopColor={isDimmedEvening ? "#FFD9A6" : "#FFFFFF"} stopOpacity={isDimmedEvening ? 0.06 : 0.14} />
                      <stop offset="100%" stopColor={isDimmedEvening ? "#FFFFFF" : "#BCAE9E"} stopOpacity={isDimmedEvening ? 0.16 : 0.3} />
                    </linearGradient>

                    {/* Front Cylindrical Glass Fresnel Overlay */}
                    <linearGradient id={`${uid}-glassFrontOverlay`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#FFFFFF" stopOpacity={isDimmedEvening ? 0.24 : 0.62} />
                      <stop offset="6%" stopColor="#FFFFFF" stopOpacity={isDimmedEvening ? 0.08 : 0.24} />
                      <stop offset="14%" stopColor="#FFFFFF" stopOpacity={isDimmedEvening ? 0.28 : 0.68} />
                      <stop offset="21%" stopColor="#FFFFFF" stopOpacity="0.02" />
                      <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0" />
                      <stop offset="82%" stopColor="#FFFFFF" stopOpacity="0.02" />
                      <stop offset="90%" stopColor="#FFF4E3" stopOpacity={isDimmedEvening ? 0.16 : 0.36} />
                      <stop offset="96%" stopColor="#FFFFFF" stopOpacity={isDimmedEvening ? 0.05 : 0.14} />
                      <stop offset="100%" stopColor="#FFFFFF" stopOpacity={isDimmedEvening ? 0.22 : 0.55} />
                    </linearGradient>

                    {/* Heavy Solid Glass Sham (Refractive Bottom Base) */}
                    <linearGradient id={`${uid}-glassSham`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={isDimmedEvening ? "#614A39" : "#BEB2A2"} stopOpacity="0.72" />
                      <stop offset="16%" stopColor={isDimmedEvening ? "#EBC194" : "#FFFFFF"} stopOpacity={isDimmedEvening ? 0.38 : 0.85} />
                      <stop offset="35%" stopColor={isDimmedEvening ? "#8F6544" : "#D6CAB9"} stopOpacity="0.48" />
                      <stop offset="52%" stopColor={isDimmedEvening ? "#F5C689" : "#FAF6EF"} stopOpacity={isDimmedEvening ? 0.42 : 0.78} />
                      <stop offset="76%" stopColor={isDimmedEvening ? "#6D4C35" : "#C9BBA9"} stopOpacity="0.52" />
                      <stop offset="90%" stopColor={isDimmedEvening ? "#E5B480" : "#FFFFFF"} stopOpacity={isDimmedEvening ? 0.35 : 0.75} />
                      <stop offset="100%" stopColor={isDimmedEvening ? "#4A3628" : "#A99C8B"} stopOpacity="0.75" />
                    </linearGradient>

                    {/* Curved Cotton Paper Label Shading */}
                    <linearGradient id={`${uid}-labelPaper`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={isDimmedEvening ? "#C9B9A6" : "#EAE2D7"} />
                      <stop offset="22%" stopColor={isDimmedEvening ? "#F3E8DA" : "#FDFBF8"} />
                      <stop offset="50%" stopColor={isDimmedEvening ? "#FFF7EC" : "#FFFFFF"} />
                      <stop offset="78%" stopColor={isDimmedEvening ? "#EFE2D2" : "#FAF7F2"} />
                      <stop offset="100%" stopColor={isDimmedEvening ? "#BFAEA0" : "#E3D9CC"} />
                    </linearGradient>

                    {/* Warm Top Light Falloff on Label in Lit Mode */}
                    <linearGradient id={`${uid}-labelWarmth`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#FFCA80" stopOpacity={isDimmedEvening ? 0.34 : 0.14} />
                      <stop offset="45%" stopColor="#E39D54" stopOpacity={isDimmedEvening ? 0.08 : 0.02} />
                      <stop offset="100%" stopColor="#261B14" stopOpacity={isDimmedEvening ? 0.24 : 0.04} />
                    </linearGradient>

                    {/* Flame Gradients */}
                    <radialGradient id={`${uid}-flameOuterHalo`} cx="50%" cy="55%" r="50%">
                      <stop offset="0%" stopColor="#FFC875" stopOpacity={isDimmedEvening ? 0.72 : 0.48} />
                      <stop offset="42%" stopColor="#E88435" stopOpacity={isDimmedEvening ? 0.36 : 0.18} />
                      <stop offset="100%" stopColor="#B84B14" stopOpacity="0" />
                    </radialGradient>

                    <linearGradient id={`${uid}-flameOuterMantle`} x1="50%" y1="0%" x2="50%" y2="100%">
                      <stop offset="0%" stopColor="#FFF2B8" stopOpacity="0.92" />
                      <stop offset="32%" stopColor="#FFB84D" stopOpacity="0.98" />
                      <stop offset="70%" stopColor="#E87320" stopOpacity="0.95" />
                      <stop offset="92%" stopColor="#C2410C" stopOpacity="0.72" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.35" />
                    </linearGradient>

                    <linearGradient id={`${uid}-flameInnerCore`} x1="50%" y1="0%" x2="50%" y2="100%">
                      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98" />
                      <stop offset="48%" stopColor="#FFF7D6" stopOpacity="0.96" />
                      <stop offset="85%" stopColor="#FFD27D" stopOpacity="0.82" />
                      <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.2" />
                    </linearGradient>

                    <radialGradient id={`${uid}-emberGlow`} cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#FFF4CC" />
                      <stop offset="45%" stopColor="#FF7A1F" />
                      <stop offset="100%" stopColor="#B8320A" stopOpacity="0" />
                    </radialGradient>

                    {/* Clip path for interior wax body */}
                    <clipPath id={`${uid}-waxClip`}>
                      <path d="M 83 154 L 85 276 A 65 13 0 0 0 215 276 L 217 154 A 67 13 0 0 1 83 154 Z" />
                    </clipPath>
                  </defs>

                  {/* ========================================================= */}
                  {/* 1. TABLETOP AMBIENT SHADOW & WARM CAUSTIC LIGHT POOL      */}
                  {/* ========================================================= */}
                  <ellipse
                    cx="150"
                    cy="302"
                    rx={isDimmedEvening ? "116" : "92"}
                    ry={isDimmedEvening ? "22" : "16"}
                    fill={`url(#${uid}-tableCaustic)`}
                    className="transition-all duration-1000"
                    style={{ opacity: isLit ? 1 : 0 }}
                  />
                  <ellipse
                    cx="150"
                    cy="300"
                    rx="78"
                    ry="15"
                    fill={`url(#${uid}-tableShadow)`}
                    filter={`url(#${uid}-shadowBlur)`}
                  />
                  {/* Tight contact ambient occlusion directly beneath glass base */}
                  <ellipse
                    cx="150"
                    cy="297"
                    rx="66"
                    ry="9"
                    fill="#120D0A"
                    opacity={isDimmedEvening ? 0.72 : 0.24}
                  />

                  {/* ========================================================= */}
                  {/* 2. BACK GLASS WALL & UPPER BACK RIM                       */}
                  {/* ========================================================= */}
                  {/* Back interior of upper glass above wax line */}
                  <path
                    d="M 76 128 A 74 15 0 0 1 224 128 L 222 290 A 72 15 0 0 1 78 290 Z"
                    fill={`url(#${uid}-glassBackWall)`}
                  />
                  {/* Subtle warm reflection cast onto the inner back glass wall when lit */}
                  <ellipse
                    cx="150"
                    cy="138"
                    rx="58"
                    ry="18"
                    fill="#FFB866"
                    filter={`url(#${uid}-medGlow)`}
                    className="transition-opacity duration-1000"
                    style={{ opacity: isDimmedEvening ? 0.34 : isLit ? 0.16 : 0 }}
                  />
                  {/* Back top glass rim arc (inner & outer bevel) */}
                  <path
                    d="M 76 128 A 74 15 0 0 1 224 128"
                    fill="none"
                    stroke={isDimmedEvening ? "rgba(255,232,204,0.28)" : "rgba(182,168,150,0.65)"}
                    strokeWidth="2.2"
                  />
                  <path
                    d="M 82 128.5 A 68 13 0 0 1 218 128.5"
                    fill="none"
                    stroke={isDimmedEvening ? "rgba(255,214,166,0.16)" : "rgba(255,255,255,0.7)"}
                    strokeWidth="1"
                  />

                  {/* ========================================================= */}
                  {/* 3. HEAVY SOLID GLASS SHAM (REFRACTIVE BASE)               */}
                  {/* ========================================================= */}
                  <path
                    d="M 79 276 A 71 14 0 0 0 221 276 L 220 291 A 70 15 0 0 1 80 291 Z"
                    fill={`url(#${uid}-glassSham)`}
                  />
                  {/* Inner refractive bottom meniscus line */}
                  <path
                    d="M 86 277 A 64 12.5 0 0 0 214 277"
                    fill="none"
                    stroke={isDimmedEvening ? "rgba(255,214,160,0.24)" : "rgba(255,255,255,0.85)"}
                    strokeWidth="1.4"
                  />
                  {/* Bright refracted glass light arc inside thick bottom */}
                  <path
                    d="M 94 287 Q 150 301 206 287"
                    fill="none"
                    stroke={isDimmedEvening ? "rgba(255,196,120,0.45)" : "rgba(255,255,255,0.92)"}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    filter={`url(#${uid}-tightBlur)`}
                  />

                  {/* ========================================================= */}
                  {/* 4. SOY WAX CYLINDER + SUBSURFACE SCATTERING               */}
                  {/* ========================================================= */}
                  {/* Solid wax vertical body */}
                  <path
                    d="M 83 154 L 85 276 A 65 13 0 0 0 215 276 L 217 154 Z"
                    fill={`url(#${uid}-waxBodyDay)`}
                    className="transition-opacity duration-1000"
                    style={{ opacity: isDimmedEvening ? 0 : 1 }}
                  />
                  <path
                    d="M 83 154 L 85 276 A 65 13 0 0 0 215 276 L 217 154 Z"
                    fill={`url(#${uid}-waxBodyNight)`}
                    className="transition-opacity duration-1000"
                    style={{ opacity: isDimmedEvening ? 1 : 0 }}
                  />

                  {/* Subsurface Scattering Warm Glow penetrating downward into wax */}
                  <g clipPath={`url(#${uid}-waxClip)`}>
                    <rect
                      x="80"
                      y="150"
                      width="140"
                      height="135"
                      fill={`url(#${uid}-waxSSS)`}
                      className="transition-opacity duration-1000"
                      style={{
                        opacity: isDimmedEvening ? 0.96 : isLit ? 0.45 : 0
                      }}
                    />
                    {/* Liquid depth translucent rim directly below wax surface when melted */}
                    <path
                      d="M 83 154 A 67 13 0 0 0 217 154 L 217 167 A 67 13 0 0 1 83 167 Z"
                      fill={isDimmedEvening ? "#E59846" : "#DFB47C"}
                      className="transition-opacity duration-1000"
                      style={{
                        opacity: isDimmedEvening ? 0.52 : isMeltPoolFull ? 0.34 : 0
                      }}
                    />
                  </g>

                  {/* ========================================================= */}
                  {/* 5. WAX TOP SURFACE & EXPANDING LIQUID MELT POOL           */}
                  {/* ========================================================= */}
                  {/* Base solid matte soy wax surface */}
                  <ellipse
                    cx="150"
                    cy="154"
                    rx="67"
                    ry="13"
                    fill={`url(#${uid}-waxTopSolid)`}
                    stroke={isDimmedEvening ? "rgba(255,215,165,0.12)" : "rgba(205,192,175,0.6)"}
                    strokeWidth="0.8"
                  />

                  {/* Expanding glossy liquid wax melt pool (smoothly scaled via CSS transform) */}
                  <g
                    className="transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{
                      transformOrigin: "150px 154px",
                      transform: isMeltPoolFull ? "scale(1, 1)" : "scale(0.24, 0.24)",
                      opacity: isMeltPoolFull ? 1 : 0
                    }}
                  >
                    {/* Main translucent amber melt pool */}
                    <ellipse
                      cx="150"
                      cy="154"
                      rx="66.5"
                      ry="12.6"
                      fill={`url(#${uid}-meltPoolGrad)`}
                    />
                    {/* Subtle wet meniscus highlight kissing the inner glass edge */}
                    <path
                      d="M 85 154.5 A 65 12 0 0 0 215 154.5"
                      fill="none"
                      stroke="#FFF6DF"
                      strokeWidth="1.2"
                      opacity={isDimmedEvening ? 0.55 : 0.72}
                    />
                    {/* Shimmering flame reflection on liquid wax surface */}
                    <ellipse
                      cx="150"
                      cy="155"
                      rx="26"
                      ry="5"
                      fill="#FFF8DF"
                      filter={`url(#${uid}-tightBlur)`}
                      className={!reducedMotion && isLit ? "wahaj-pool-shimmer" : undefined}
                    />
                    <ellipse
                      cx="150"
                      cy="154"
                      rx="11"
                      ry="2.2"
                      fill="#FFFFFF"
                      opacity="0.85"
                    />
                  </g>

                  {/* ========================================================= */}
                  {/* 6. BRAIDED COTTON WICK & INCANDESCENT EMBER               */}
                  {/* ========================================================= */}
                  {/* Tiny melted depression shadow around wick base */}
                  <ellipse
                    cx="150"
                    cy="154"
                    rx="5.5"
                    ry="1.6"
                    fill={isLit ? "#8F4A18" : "#9E9181"}
                    opacity={isLit ? 0.55 : 0.45}
                  />

                  {/* Untrimmed curved cotton wick (visible in Step 01) */}
                  <g
                    className="transition-all duration-700 ease-out"
                    style={{
                      opacity: isWickTrimmed ? 0 : 1,
                      transform: isWickTrimmed ? "translateY(4px) scaleY(0.75)" : "translateY(0) scaleY(1)",
                      transformOrigin: "150px 154px"
                    }}
                  >
                    {/* Lower clean braided stem */}
                    <path
                      d="M 150 154 C 150 144, 151 135, 154 126 C 155 123, 156 121, 155 119"
                      fill="none"
                      stroke="#3A312B"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                    />
                    {/* Braided cotton highlight fiber */}
                    <path
                      d="M 149.4 152 C 149.6 144, 150.6 136, 153 128"
                      fill="none"
                      stroke="#7D6F63"
                      strokeWidth="0.9"
                      strokeDasharray="2 2.2"
                      strokeLinecap="round"
                    />
                    {/* Carbonized mushroom tip at top of untrimmed wick */}
                    <circle cx="155.2" cy="118.8" r="2.2" fill="#1C1816" />
                  </g>

                  {/* Crisply trimmed 5mm upright wick (visible in Step 02 & 03) */}
                  <g
                    className="transition-all duration-700 ease-out"
                    style={{
                      opacity: isWickTrimmed ? 1 : 0,
                      transformOrigin: "150px 154px"
                    }}
                  >
                    <path
                      d="M 150 154 L 150 137"
                      fill="none"
                      stroke={isDimmedEvening ? "#241913" : "#2D241E"}
                      strokeWidth="2.6"
                      strokeLinecap="round"
                    />
                    {/* Subtle warm rim highlight on wick */}
                    <path
                      d="M 149.4 153 L 149.4 140"
                      fill="none"
                      stroke="#A87042"
                      strokeWidth="0.8"
                      opacity="0.7"
                    />
                    {/* Glowing incandescent orange-white ember tip */}
                    <circle
                      cx="150"
                      cy="137"
                      r="4.2"
                      fill={`url(#${uid}-emberGlow)`}
                      opacity={isLit ? 0.95 : 0}
                    />
                    <circle cx="150" cy="136.8" r="1.4" fill="#FFF2CC" opacity={isLit ? 1 : 0} />
                  </g>

                  {/* ========================================================= */}
                  {/* 7. ULTRA-REALISTIC MULTI-ZONE CANDLE FLAME                */}
                  {/* ========================================================= */}
                  <g
                    className="transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{
                      opacity: isLit ? 1 : 0,
                      transform: isLit ? "scale(1) translateY(0px)" : "scale(0.25) translateY(10px)",
                      transformOrigin: "150px 137px"
                    }}
                  >
                    {/* Volumetric Ambient Halo */}
                    <g className={!reducedMotion && isLit ? "wahaj-halo-pulse" : undefined}>
                      <ellipse
                        cx="150"
                        cy="108"
                        rx={isDimmedEvening ? "52" : "34"}
                        ry={isDimmedEvening ? "62" : "44"}
                        fill={`url(#${uid}-flameOuterHalo)`}
                        filter={`url(#${uid}-softGlow)`}
                        className="transition-all duration-1000"
                      />
                    </g>

                    {/* Animated Flame Body */}
                    <g className={!reducedMotion && isLit ? "wahaj-flame-sway" : undefined}>
                      {/* Soft outer golden bloom */}
                      <path
                        d="M 150 74 C 164 98, 166 121, 158 134 C 154.5 139, 145.5 139, 142 134 C 134 121, 136 98, 150 74 Z"
                        fill="#FF9F38"
                        opacity={isDimmedEvening ? 0.45 : 0.28}
                        filter={`url(#${uid}-medGlow)`}
                      />

                      {/* Zone 4: Main Golden-Amber Outer Mantle */}
                      <path
                        d="M 150 79 C 160 100, 162.5 120, 156 132.5 C 153.5 137, 146.5 137, 144 132.5 C 137.5 120, 140 100, 150 79 Z"
                        fill={`url(#${uid}-flameOuterMantle)`}
                      />

                      {/* Zone 3: White-Hot Luminous Inner Mantle */}
                      <g className={!reducedMotion && isLit ? "wahaj-core-breath" : undefined}>
                        <path
                          d="M 150 94 C 156 108, 157.5 121, 153.8 130.5 C 152 134, 148 134, 146.2 130.5 C 142.5 121, 144 108, 150 94 Z"
                          fill={`url(#${uid}-flameInnerCore)`}
                        />
                        {/* Pure incandescent pinpoint heart */}
                        <ellipse cx="150" cy="118" rx="3.5" ry="9" fill="#FFFFFF" opacity="0.72" filter={`url(#${uid}-tightBlur)`} />
                      </g>

                      {/* Zone 2: Tiny dark unburnt gas vapor pocket around wick tip */}
                      <ellipse cx="150" cy="133.2" rx="2.6" ry="4.5" fill="#2A160B" opacity="0.48" />

                      {/* Zone 1: Subtle cobalt-blue oxygen combustion zone at flame base */}
                      <path
                        d="M 143.6 127.5 C 144.2 136.5, 155.8 136.5, 156.4 127.5 C 154.6 132.8, 145.4 132.8, 143.6 127.5 Z"
                        fill="#4F9CFF"
                        opacity={isDimmedEvening ? 0.78 : 0.55}
                        filter={`url(#${uid}-blueBlur)`}
                      />
                    </g>
                  </g>

                  {/* ========================================================= */}
                  {/* 8. DELICATE BOTANICAL AROMA WISPS (STEP 03 EVENING CALM)  */}
                  {/* ========================================================= */}
                  <g
                    className="transition-opacity duration-1000"
                    style={{ opacity: isDimmedEvening && !reducedMotion ? 1 : 0 }}
                  >
                    <path
                      d="M 148 68 C 140 54, 158 44, 147 28"
                      fill="none"
                      stroke="#FFE5C2"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      filter={`url(#${uid}-tightBlur)`}
                      className="wahaj-aroma-1"
                    />
                    <path
                      d="M 154 64 C 164 50, 146 38, 157 22"
                      fill="none"
                      stroke="#FFD29D"
                      strokeWidth="1.1"
                      strokeLinecap="round"
                      filter={`url(#${uid}-tightBlur)`}
                      className="wahaj-aroma-2"
                    />
                  </g>

                  {/* ========================================================= */}
                  {/* 9. FRONT GLASS WALL, CURVED LABEL & SPECULAR REFLECTIONS  */}
                  {/* ========================================================= */}
                  {/* Front Glass Fresnel Overlay */}
                  <path
                    d="M 76 128 A 74 15 0 0 0 224 128 L 220 291 A 70 15 0 0 1 80 291 Z"
                    fill={`url(#${uid}-glassFrontOverlay)`}
                    pointerEvents="none"
                  />

                  {/* Curved Luxury Apothecary Paper Label hugging the cylinder */}
                  <g>
                    {/* Subtle paper drop shadow against glass */}
                    <path
                      d="M 103 188 Q 150 199 197 188 L 197 259 Q 150 270 103 259 Z"
                      fill="#1C1510"
                      opacity={isDimmedEvening ? 0.34 : 0.08}
                      filter={`url(#${uid}-tightBlur)`}
                    />
                    {/* Main textured cotton paper label */}
                    <path
                      d="M 102 186 Q 150 197 198 186 L 198 257 Q 150 268 102 257 Z"
                      fill={`url(#${uid}-labelPaper)`}
                      stroke={isDimmedEvening ? "rgba(255,235,210,0.3)" : "#DDD3C5"}
                      strokeWidth="0.9"
                    />
                    {/* Flame light warm falloff over label */}
                    <path
                      d="M 102 186 Q 150 197 198 186 L 198 257 Q 150 268 102 257 Z"
                      fill={`url(#${uid}-labelWarmth)`}
                      className="transition-opacity duration-1000"
                      style={{ opacity: isLit ? 1 : 0 }}
                    />
                    {/* Inset hairline luxury border */}
                    <path
                      d="M 106.5 190.5 Q 150 200.5 193.5 190.5 L 193.5 252.5 Q 150 262.5 106.5 252.5 Z"
                      fill="none"
                      stroke={isDimmedEvening ? "rgba(184,124,72,0.45)" : "rgba(184,158,130,0.55)"}
                      strokeWidth="0.65"
                    />
                    {/* Refined Brand Typography */}
                    <text
                      x="150"
                      y="217"
                      textAnchor="middle"
                      fill="#1C1917"
                      fontSize="13.5"
                      fontWeight="700"
                      letterSpacing="3.4"
                      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                    >
                      WAHAJ
                    </text>
                    {/* Minimalist Hairline Divider */}
                    <line
                      x1="132"
                      y1="224.5"
                      x2="168"
                      y2="224.5"
                      stroke="#B85A2D"
                      strokeWidth="0.7"
                      opacity="0.7"
                    />
                    <text
                      x="150"
                      y="236"
                      textAnchor="middle"
                      fill="#756556"
                      fontSize="6.1"
                      fontWeight="600"
                      letterSpacing="1.6"
                    >
                      100% SOY WAX
                    </text>
                    <text
                      x="150"
                      y="247"
                      textAnchor="middle"
                      fill="#9C8D7E"
                      fontSize="5.2"
                      letterSpacing="1.2"
                    >
                      HAND-POURED · 220G
                    </text>
                  </g>

                  {/* Crisp Glass Edge Highlights (Left & Right Vertical Speculars) */}
                  <path
                    d="M 85 138 L 87.5 282"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    opacity={isDimmedEvening ? 0.16 : 0.62}
                    filter={`url(#${uid}-tightBlur)`}
                  />
                  <path
                    d="M 92 140 L 94 278"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="1"
                    strokeLinecap="round"
                    opacity={isDimmedEvening ? 0.12 : 0.42}
                  />
                  <path
                    d="M 215 138 L 212.5 282"
                    fill="none"
                    stroke={isDimmedEvening ? "#FFD9A6" : "#FFFFFF"}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    opacity={isDimmedEvening ? 0.22 : 0.45}
                    filter={`url(#${uid}-tightBlur)`}
                  />

                  {/* Outer Glass Contour Silhouette */}
                  <path
                    d="M 76 128 L 80 291 A 70 15 0 0 0 220 291 L 224 128"
                    fill="none"
                    stroke={isDimmedEvening ? "rgba(255,222,185,0.26)" : "rgba(182,169,154,0.72)"}
                    strokeWidth="1.2"
                  />

                  {/* Front Beveled Top Glass Rim (catches bright flame/daylight highlight) */}
                  <path
                    d="M 76 128 A 74 15 0 0 0 224 128"
                    fill="none"
                    stroke={isDimmedEvening ? "rgba(255,212,158,0.42)" : "rgba(198,186,172,0.85)"}
                    strokeWidth="2.4"
                  />
                  <path
                    d="M 84 132 A 70 13.5 0 0 0 216 132"
                    fill="none"
                    stroke={isDimmedEvening ? "rgba(255,240,214,0.52)" : "rgba(255,255,255,0.92)"}
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />

                  {/* ========================================================= */}
                  {/* 10. TECHNICAL ARCHITECTURAL STEP INDICATORS               */}
                  {/* ========================================================= */}
                  {/* Step 01: Precision 5mm Wick Trim Guide + Trimmer Cue */}
                  <g
                    className="transition-all duration-700 ease-out"
                    style={{
                      opacity: activeStep === 0 ? 1 : 0,
                      transform: activeStep === 0 ? "translateX(0px)" : "translateX(10px)",
                      pointerEvents: "none"
                    }}
                  >
                    {/* Cut plane dashed guide crossing the wick at 5mm */}
                    <line
                      x1="60"
                      y1="138"
                      x2="168"
                      y2="138"
                      stroke="#B85A2D"
                      strokeWidth="1.15"
                      strokeDasharray="3.5 3"
                    />
                    {/* Vertical 5mm caliper bracket between wax surface and cut line */}
                    <path
                      d="M 62 138 L 62 154 M 58.5 138 L 65.5 138 M 58.5 154 L 65.5 154"
                      fill="none"
                      stroke="#B85A2D"
                      strokeWidth="1.1"
                    />
                    {/* Target cut pulse dot on wick */}
                    <circle
                      cx="150"
                      cy="138"
                      r="4.5"
                      fill="none"
                      stroke="#B85A2D"
                      strokeWidth="1.1"
                      className={!reducedMotion ? "wahaj-cut-pulse" : undefined}
                    />
                    <circle cx="150" cy="138" r="2" fill="#B85A2D" />

                    {/* Clean architectural pill badge for "5 mm" */}
                    <rect
                      x="24"
                      y="138"
                      width="32"
                      height="16"
                      rx="8"
                      fill="#FAF8F5"
                      stroke="#D8C8B6"
                      strokeWidth="0.9"
                    />
                    <text
                      x="40"
                      y="148.8"
                      textAnchor="middle"
                      fill="#9E4A22"
                      fontSize="8.5"
                      fontWeight="700"
                    >
                      5mm
                    </text>

                    {/* Minimalist scissor icon at right end of cut line */}
                    <g transform="translate(174, 138)" stroke="#B85A2D" strokeWidth="1.15" fill="none" strokeLinecap="round">
                      <circle cx="8" cy="-3.2" r="2.1" />
                      <circle cx="8" cy="3.2" r="2.1" />
                      <path d="M 6.2 -2 L -2.5 2.4 M 6.2 2 L -2.5 -2.4" />
                    </g>
                  </g>

                  {/* Step 02: Edge-to-Edge Melt Pool Span Indicator */}
                  <g
                    className="transition-all duration-700 ease-out"
                    style={{
                      opacity: activeStep === 1 ? 1 : 0,
                      transform: activeStep === 1 ? "translateY(0px)" : "translateY(6px)",
                      pointerEvents: "none"
                    }}
                  >
                    <path
                      d="M 83 145 L 83 151 M 217 145 L 217 151"
                      stroke="#B85A2D"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                    />
                    <line
                      x1="86"
                      y1="148"
                      x2="132"
                      y2="148"
                      stroke="#B85A2D"
                      strokeWidth="0.95"
                      strokeDasharray="2.5 2.5"
                      opacity="0.85"
                    />
                    <line
                      x1="168"
                      y1="148"
                      x2="214"
                      y2="148"
                      stroke="#B85A2D"
                      strokeWidth="0.95"
                      strokeDasharray="2.5 2.5"
                      opacity="0.85"
                    />
                    <circle cx="83" cy="154" r="2.2" fill="#B85A2D" />
                    <circle cx="217" cy="154" r="2.2" fill="#B85A2D" />
                  </g>
                </svg>
              </div>

              {/* Bottom Stage Caption */}
              <div className="relative z-10 w-full text-center">
                <p
                  className={`text-xs font-medium transition-colors duration-500 ${
                    isDimmedEvening ? "text-[#E5D9CC]" : "text-[#57534E]"
                  }`}
                >
                  {steps[activeStep].title} —{" "}
                  <span className="text-[#B85A2D]">{steps[activeStep].metric}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
