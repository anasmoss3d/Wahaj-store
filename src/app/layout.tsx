import type { Metadata } from "next";
import { Cairo, Inter } from "next/font/google";
import "@/app/globals.css";
import { direction, getLocale } from "@/lib/i18n";

const inter = Inter({ subsets: ["latin"], variable: "--font-latin" });
const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-arabic", weight: ["400", "600", "700", "800"] });

export const metadata: Metadata = {
  title: {
    default: "Wahaj | Handmade Concrete Decor",
    template: "%s | Wahaj"
  },
  description: "Premium handmade concrete decor with configurable colors and add-ons.",
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "Wahaj | Handmade Concrete Decor",
    description: "Premium handmade concrete decor with configurable colors and add-ons.",
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
