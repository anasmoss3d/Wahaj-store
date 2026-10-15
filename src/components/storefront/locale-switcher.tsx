"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocaleAction } from "@/app/actions/shop";
import type { Locale } from "@/lib/i18n";

export function LocaleSwitcher({ current }: { current: Locale }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    startTransition(async () => {
      await setLocaleAction(next);
      router.refresh();
    });
  }

  return (
    <div
      aria-label="Language"
      className="inline-flex items-center rounded-md border border-concrete-200 bg-white text-sm font-semibold"
      role="group"
    >
      {(["ar", "en"] as const).map((locale) => (
        <button
          className={
            current === locale
              ? "min-h-9 rounded-md bg-concrete-900 px-3 text-white"
              : "min-h-9 px-3 text-concrete-600 hover:text-concrete-900"
          }
          disabled={pending || current === locale}
          key={locale}
          onClick={() => switchTo(locale)}
          type="button"
        >
          {locale === "ar" ? "عربي" : "EN"}
        </button>
      ))}
    </div>
  );
}
