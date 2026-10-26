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
