import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Strictly ASCII slug. Arabic product names have no ASCII characters, so this
 * returns "" for them — pair it with a SKU-based fallback in suggestProductSlug.
 */
export function asciiSlug(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

/**
 * Prefers readable Latin letters from the name; falls back to the ASCII SKU
 * (e.g. "candles-1002") when the name is Arabic or otherwise has no Latin
 * characters. Last resort is a timestamped fallback so saves never fail.
 */
export function suggestProductSlug(name: string, sku: string) {
  return asciiSlug(name) || asciiSlug(sku) || `product-${Date.now()}`;
}

/**
 * Placeholder stored while a product's real SKU is still generated
 * server-side. It is never shown to customers: the form disables the field
 * and the API replaces it on save.
 */
export const SKU_SUGGESTED = "WAH-AUTO";

/** Short readable stem for an auto SKU, e.g. "Black Luxury Tray" -> "BLACKLUXURYTRAY". */
export function skuStem(name: string) {
  const compact = asciiSlug(name).replace(/-/g, "").slice(0, 14);
  return compact.length >= 3 ? compact.toUpperCase() : "WAH";
}

function skuCounter(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return hash % 900 + 100;
}

/** Deterministic SKU preview for the admin form; the final value is generated uniquely on the server. */
export function suggestedProductSku(name: string) {
  return name.trim() ? `WAH-${skuStem(name)}-${skuCounter(name)}` : `${SKU_SUGGESTED}-000`;
}

export function compact<T>(items: Array<T | null | undefined>) {
  return items.filter(Boolean) as T[];
}

/** Only allow same-site paths for post-login redirects (blocks open redirects). */
export function safeNextPath(value: string | null | undefined, fallback = "/account") {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    value.length > 512
  ) {
    return fallback;
  }
  return value;
}

export function absoluteUrl(path = "") {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  try {
    const url = new URL(path);
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
  } catch {
    // Resolve relative paths against the storefront URL below.
  }
  return new URL(path.startsWith("/") ? path : `/${path}`, appUrl).toString();
}
