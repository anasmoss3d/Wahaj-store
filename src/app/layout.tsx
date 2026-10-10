import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"] });

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html dir="ltr" lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
