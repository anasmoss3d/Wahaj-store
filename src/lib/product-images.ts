import { isCustomColorName } from "@/lib/dictionary";

const ribbedVaseImages: Record<string, string> = {
  "blush pink": "/products/vases/blush-pink.webp",
  "وردي ناعم": "/products/vases/blush-pink.webp",
  "custom color": "/products/vases/color-options.webp",
  "لون مخصص": "/products/vases/color-options.webp",
  "soft beige": "/products/vases/soft-beige.webp",
  "بيج ناعم": "/products/vases/soft-beige.webp",
  "warm white": "/products/vases/warm-white.webp",
  "أبيض دافئ": "/products/vases/warm-white.webp",
  "concrete gray": "/products/vases/concrete-gray.webp",
  "رمادي خرساني": "/products/vases/concrete-gray.webp"
};

function isRibbedVase(slug: string) {
  return slug.trim().toLowerCase() === "vase";
}

export function getProductColorImageUrl(slug: string, colorName: string, fallback: string) {
  if (!isRibbedVase(slug)) return fallback;

  const normalizedColor = colorName.trim().toLowerCase().replace(/\s+/g, " ");
  if (
    isCustomColorName(colorName) &&
    (/^https?:\/\//i.test(fallback) || fallback.startsWith("/uploads/"))
  ) {
    return fallback;
  }

  return ribbedVaseImages[normalizedColor] ?? fallback;
}

export function getProductMainImageUrl(_slug: string, mainImage: string) {
  return mainImage;
}
