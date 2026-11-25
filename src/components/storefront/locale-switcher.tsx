"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Globe } from "lucide-react";
import { setLocaleAction } from "@/app/actions/shop";
import type { Locale } from "@/lib/i18n";

const OPTIONS: ReadonlyArray<{ value: Locale; shortLabel: string; fullLabel: string }> = [
  { value: "ar", shortLabel: "عربي", fullLabel: "العربية" },
  { value: "en", shortLabel: "EN", fullLabel: "English" }
];

export function LocaleSwitcher({
  current,
  dropUp = false,
  glassy = false
}: {
  current: Locale;
  dropUp?: boolean;
  glassy?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  const activeOption = OPTIONS.find((opt) => opt.value === current) ?? OPTIONS[0];

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function switchTo(next: Locale) {
    setOpen(false);
    if (next === current) return;
    startTransition(async () => {
      await setLocaleAction(next);
      router.refresh();
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Language"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={pending}
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex h-9 sm:h-10 items-center gap-1.5 rounded-full border px-3 text-xs font-medium text-[#1C1917] transition-all duration-300 disabled:opacity-60 ${
          glassy
            ? "border-white/70 bg-white/55 hover:bg-white/85"
            : "border-[#E8E2D8] bg-[#F4EFEB] hover:bg-[#EAE4DC]"
        }`}
      >
        <Globe size={14} className="text-[#78716C]" aria-hidden />
        <span>{activeOption.shortLabel}</span>
        <ChevronDown
          size={13}
          aria-hidden
          className={`text-[#78716C] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Select language"
          className={`absolute end-0 z-50 min-w-[144px] rounded-2xl border border-[#E4DDD2]/90 bg-[#FAF8F5]/95 p-1.5 backdrop-blur-xl shadow-[0_14px_34px_-10px_rgba(28,25,23,0.18)] ${
            dropUp ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          {OPTIONS.map((option) => {
            const isSelected = option.value === current;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={pending}
                onClick={() => switchTo(option.value)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-[#EFE8DC] text-[#1C1917]"
                    : "text-[#57534E] hover:bg-[#F2ECE3]/80 hover:text-[#1C1917]"
                }`}
              >
                <span>{option.fullLabel}</span>
                {isSelected ? <Check size={13} className="text-[#B85A2D]" aria-hidden /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
