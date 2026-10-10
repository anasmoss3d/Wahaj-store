export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ar";

export function direction(locale: Locale) {
  return locale === "ar" ? "rtl" : "ltr";
}

export const dictionary = {
  ar: {
    storeName: "وهج",
    tagline: "ديكور كونكريت مصنوع يدويًا بتخصيصات فاخرة",
    cart: "السلة",
    products: "المنتجات",
    checkout: "إتمام الطلب",
    admin: "الإدارة"
  },
  en: {
    storeName: "Wahaj",
    tagline: "Handmade concrete decor with premium customization",
    cart: "Cart",
    products: "Products",
    checkout: "Checkout",
    admin: "Admin"
  }
} satisfies Record<Locale, Record<string, string>>;
