"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

export function SmoothScroll() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.085,
      smoothWheel: true,
      wheelMultiplier: 0.95,
      anchors: {
        offset: -76
      },
      allowNestedScroll: true,
      prevent: (node) =>
        node.hasAttribute("data-lenis-prevent") || Boolean(node.closest("[role='dialog']"))
    });

    return () => {
      lenis.destroy();
    };
  }, []);

  return null;
}
