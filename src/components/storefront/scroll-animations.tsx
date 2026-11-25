"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

function subscribeReducedMotion(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );
}

export function useInViewOnce<T extends HTMLElement = HTMLDivElement>(
  threshold = 0.14,
  rootMargin = "0px 0px -60px 0px"
) {
  const ref = useRef<T>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [intersected, setIntersected] = useState(false);

  useEffect(() => {
    if (reducedMotion || intersected) return;
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      const id = window.requestAnimationFrame(() => setIntersected(true));
      return () => window.cancelAnimationFrame(id);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIntersected(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion, intersected, threshold, rootMargin]);

  return { ref, inView: reducedMotion || intersected };
}

/**
 * Updates CSS custom properties directly on the target element inside RAF
 * on scroll/resize, avoiding React re-renders for 60fps scroll-linked effects.
 */
export function useScrollVars<T extends HTMLElement = HTMLElement>(
  compute: (el: T, rect: DOMRect, viewportH: number) => Record<string, string>,
  fallbackVars: Record<string, string>
) {
  const ref = useRef<T>(null);
  const reducedMotion = usePrefersReducedMotion();
  const computeRef = useRef(compute);
  const fallbackRef = useRef(fallbackVars);

  useEffect(() => {
    computeRef.current = compute;
    fallbackRef.current = fallbackVars;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const applyVars = (vars: Record<string, string>) => {
      for (const [key, val] of Object.entries(vars)) {
        el.style.setProperty(key, val);
      }
    };

    if (reducedMotion) {
      applyVars(fallbackRef.current);
      return;
    }

    let rafId = 0;

    const update = () => {
      rafId = 0;
      const node = ref.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const viewportH = window.innerHeight || 900;
      applyVars(computeRef.current(node, rect, viewportH));
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
  }, [reducedMotion]);

  return ref;
}

const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

function toArabicDigits(n: number) {
  return String(n).replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)] ?? d);
}

export function CountUpNumber({
  target,
  active = true,
  duration = 900,
  arabicDigits = false,
  prefix = "",
  suffix = ""
}: {
  target: number;
  active?: boolean;
  duration?: number;
  arabicDigits?: boolean;
  prefix?: string;
  suffix?: string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [animatedValue, setAnimatedValue] = useState<number | null>(null);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!active || reducedMotion || completedRef.current) return;

    let rafId = 0;
    let startTime = 0;

    const tick = (now: number) => {
      if (!startTime) startTime = now;
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(Math.round(eased * target));
      if (progress < 1) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        completedRef.current = true;
        setAnimatedValue(null);
      }
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [active, reducedMotion, target, duration]);

  const displayNumber = reducedMotion || animatedValue === null ? target : animatedValue;
  const formatted = arabicDigits ? toArabicDigits(displayNumber) : String(displayNumber);

  return (
    <span>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
