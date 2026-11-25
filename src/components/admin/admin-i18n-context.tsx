"use client";

import * as React from "react";
import {
  adminDictionaries,
  defaultLocale,
  type AdminDictionary,
  type Locale
} from "@/lib/dictionary-admin-bridge";

interface AdminI18nContextValue {
  locale: Locale;
  isArabic: boolean;
  dict: AdminDictionary;
}

const AdminI18nContext = React.createContext<AdminI18nContextValue>({
  locale: defaultLocale,
  isArabic: defaultLocale === "ar",
  dict: adminDictionaries[defaultLocale]
});

export function AdminI18nProvider({
  locale,
  dict,
  children
}: {
  locale: Locale;
  dict: AdminDictionary;
  children: React.ReactNode;
}) {
  const value = React.useMemo(
    () => ({
      locale,
      isArabic: locale === "ar",
      dict
    }),
    [locale, dict]
  );

  return (
    <AdminI18nContext.Provider value={value}>
      {children}
    </AdminI18nContext.Provider>
  );
}

export function useAdminI18n() {
  return React.useContext(AdminI18nContext);
}
