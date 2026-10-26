const ribbedVaseImages: Record<string, string> = {
  "blush pink": "/products/vases/blush-pink.webp",
  "custom color": "/products/vases/color-options.webp",
  "soft beige": "/products/vases/soft-beige.webp",
  "warm white": "/products/vases/warm-white.webp",
  "concrete gray": "/products/vases/concrete-gray.webp"
};

function isRibbedVase(slug: string) {
  return slug.trim().toLowerCase() === "vase";
}

export function getProductColorImageUrl(slug: string, colorName: string, fallback: string) {
  if (!isRibbedVase(slug)) return fallback;

  const normalizedColor = colorName.trim().toLowerCase().replace(/\s+/g, " ");
  return ribbedVaseImages[normalizedColor] ?? fallback;
}

export function getProductMainImageUrl(slug: string, fallback: string) {
  if (!isRibbedVase(slug)) return fallback;
  return ribbedVaseImages["blush pink"];
}
