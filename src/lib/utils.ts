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

export function compact<T>(items: Array<T | null | undefined>) {
  return items.filter(Boolean) as T[];
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
