import type { Metadata } from "next";
import localFont from "next/font/local";
import "@/app/globals.css";
import { SmoothScroll } from "@/components/storefront/smooth-scroll";
import { direction, getLocale } from "@/lib/i18n";

// Self-hosted fonts
const geist = localFont({
  src: [
    { path: "./fonts/Geist-latin.woff2", weight: "100 900", style: "normal" },
    { path: "./fonts/Geist-latin-ext.woff2", weight: "100 900", style: "normal" }
  ],
  variable: "--font-latin",
  display: "swap"
});

const geistMono = localFont({
  src: [
    { path: "./fonts/GeistMono-latin.woff2", weight: "100 900", style: "normal" },
    { path: "./fonts/GeistMono-latin-ext.woff2", weight: "100 900", style: "normal" }
  ],
  variable: "--font-mono",
  display: "swap"
});

const cairo = localFont({
  src: [
    { path: "./fonts/Cairo-latin.woff2", weight: "200 1000", style: "normal" },
    { path: "./fonts/Cairo-arabic.woff2", weight: "200 1000", style: "normal" }
  ],
  variable: "--font-arabic"
});

const cormorant = localFont({
  src: "./fonts/CormorantGaramond-latin.woff2",
  variable: "--font-serif",
  display: "swap"
});

const amiri = localFont({
  src: "./fonts/Amiri-arabic.woff2",
  variable: "--font-amiri",
  display: "swap"
});

// Thmanyah Fonts (Local self-hosted with full weights including Black 900 for Extended display)
const thmanyahSans = localFont({
  src: [
    { path: "./fonts/thmanyah-sans-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/thmanyah-sans-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/thmanyah-sans-Bold.woff2", weight: "700", style: "normal" },
    { path: "./fonts/thmanyah-sans-Black.woff2", weight: "900", style: "normal" }
  ],
  variable: "--font-thmanyah-sans",
  display: "swap"
});

const thmanyahSerif = localFont({
  src: [
    { path: "./fonts/thmanyah-serif-display-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/thmanyah-serif-display-Bold.woff2", weight: "700", style: "normal" },
    { path: "./fonts/thmanyah-serif-display-Black.woff2", weight: "900", style: "normal" }
  ],
  variable: "--font-thmanyah-serif",
  display: "swap"
});

export const metadata: Metadata = {
  title: {
    default: "Wahaj | Handmade Soy Candles & Decor",
    template: "%s | Wahaj"
  },
  description: "Handmade soy candles & luxury home pieces. Natural soy wax, cotton wicks, and rich botanical scents.",
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  icons: {
    icon: "/brand/wahaj-logo.jpg",
    apple: "/brand/wahaj-logo.jpg"
  },
  openGraph: {
    title: "Wahaj | Handmade Soy Candles & Decor",
    description: "Handmade soy candles & luxury home pieces. Natural soy wax, cotton wicks, and rich botanical scents.",
    siteName: "Wahaj"
  }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html dir={direction(locale)} lang={locale}>
      <body
        className={`${geist.variable} ${geistMono.variable} ${cairo.variable} ${cormorant.variable} ${amiri.variable} ${thmanyahSans.variable} ${thmanyahSerif.variable} font-sans bg-[#f7f4ee] text-[#1C1917] antialiased`}
      >
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
