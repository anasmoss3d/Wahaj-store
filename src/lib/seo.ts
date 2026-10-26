import type { Product } from "@prisma/client";
import { absoluteUrl } from "@/lib/utils";

export function productJsonLd(product: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
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
