"use client";

import { useSyncExternalStore } from "react";
import {
  dictionary,
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  type Locale
} from "@/lib/dictionary";

function readLocaleFromCookie(): Locale {
  if (typeof document === "undefined") return defaultLocale;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]+)`));
  return isLocale(match?.[1]) ? match[1] : defaultLocale;
}

const listeners = new Set<() => void>();

export function useTranslations() {
  const locale = useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange);
      return () => listeners.delete(onStoreChange);
    },
    readLocaleFromCookie,
    () => defaultLocale
  );
  return dictionary[locale];
}
