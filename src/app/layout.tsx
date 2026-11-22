import type { Metadata } from "next";
import localFont from "next/font/local";
import "@/app/globals.css";
import { direction, getLocale } from "@/lib/i18n";

// Self-hosted variable fonts (fetch via `scripts/fetch-fonts.ps1`).
// Vercel builds cannot reach fonts.googleapis.com at build time, so next/font/google
// fails there; local fonts ship in the build output instead.
const inter = localFont({
  src: [
    { path: "./fonts/Inter-latin.woff2", weight: "100 900", style: "normal" },
    { path: "./fonts/Inter-latin-ext.woff2", weight: "100 900", style: "normal" }
  ],
  variable: "--font-latin"
});
const cairo = localFont({
  src: [
    { path: "./fonts/Cairo-latin.woff2", weight: "200 1000", style: "normal" },
    { path: "./fonts/Cairo-arabic.woff2", weight: "200 1000", style: "normal" }
  ],
  variable: "--font-arabic"
});

export const metadata: Metadata = {
  title: {
    default: "Wahaj | Handmade Decor",
    template: "%s | Wahaj"
  },
  description: "Premium handmade decor with configurable colors and add-ons.",
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  icons: {
    icon: "/brand/wahaj-logo.jpg",
    apple: "/brand/wahaj-logo.jpg"
  },
  openGraph: {
    title: "Wahaj | Handmade Decor",
    description: "Premium handmade decor with configurable colors and add-ons.",
    siteName: "Wahaj"
  }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html dir={direction(locale)} lang={locale}>
      <body className={`${inter.variable} ${cairo.variable}`}>{children}</body>
    </html>
  );
}
