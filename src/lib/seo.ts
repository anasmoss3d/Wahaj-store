import type { Product } from "@prisma/client";
import { pickLocalized, type Locale } from "@/lib/dictionary";
import { absoluteUrl } from "@/lib/utils";

export function productJsonLd(product: Product, locale: Locale = "ar") {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pickLocalized(locale, product.name, product.nameEn),
    description: pickLocalized(locale, product.description, product.descriptionEn),
    sku: product.sku,
    image: absoluteUrl(product.mainImage),
    offers: {
      "@type": "Offer",
      priceCurrency: "EGP",
      price: product.basePrice.toString(),
      url: absoluteUrl(`/products/${product.slug}`)
    }
  };
}
