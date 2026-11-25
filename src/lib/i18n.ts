import { cookies } from "next/headers";
import { cache } from "react";
import { adminDictionaries, type AdminDictionary } from "./admin-i18n";
import {
  dictionary,
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  type Dictionary,
  type Locale
} from "./dictionary";

export {
  LOCALE_COOKIE,
  defaultLocale,
  dictionary,
  isCustomColorName,
  isLocale,
  locales,
  pickLocalized,
  type Dictionary,
  type Locale
} from "./dictionary";
export {
  adminDictionaries,
  getAdminRoleLabel,
  interpolate,
  type AdminDictionary
} from "./admin-i18n";

export function direction(locale: Locale) {
  return locale === "ar" ? "rtl" : "ltr";
}

async function getLocaleUncached(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
}

export const getLocale = cache(getLocaleUncached);

async function getDictionaryUncached(): Promise<Dictionary> {
  return dictionary[await getLocale()];
}

export const getDictionary = cache(getDictionaryUncached);

async function getAdminDictionaryUncached(): Promise<AdminDictionary> {
  return adminDictionaries[await getLocale()];
}

export const getAdminDictionary = cache(getAdminDictionaryUncached);

export type OrderStatusKey =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export const statusLabels: Record<Locale, Record<OrderStatusKey, string>> = {
  ar: {
    PENDING: "بانتظار التأكيد",
    CONFIRMED: "تم التأكيد",
    PREPARING: "قيد التجهيز",
    READY: "جاهز",
    SHIPPED: "تم الشحن",
    DELIVERED: "تم التوصيل",
    CANCELLED: "ملغي"
  },
  en: {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    PREPARING: "Preparing",
    READY: "Ready",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled"
  }
};
