import { cookies } from "next/headers";
import { cache } from "react";
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
  isLocale,
  locales,
  type Dictionary,
  type Locale
} from "./dictionary";

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
