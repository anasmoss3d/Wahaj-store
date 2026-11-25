import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { LocaleSwitcher } from "@/components/storefront/locale-switcher";
import { getDictionary, getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const isArabic = locale === "ar";

  return (
    <div className="grid min-h-svh bg-[#F7F4EE] lg:h-svh lg:overflow-hidden lg:grid-cols-2">
      {/* Column 1: Fixed-anchor Brand Bar + Stable Form Column + Quiet Footer */}
      <div className="flex min-h-svh flex-col justify-between gap-3 p-4 sm:gap-4 sm:p-6 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:gap-4 lg:px-10 lg:py-5">
        <header className="flex shrink-0 items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              aria-label={dict.storeNameFull}
              className="group inline-flex shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B85A2D]/30"
            >
              <span className="relative block h-10 w-10 overflow-hidden rounded-full border border-[#DFD7CB] shadow-sm transition-transform duration-300 group-hover:scale-105">
                <Image
                  alt="Wahaj"
                  src="/brand/wahaj-logo.jpg"
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </span>
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E2D8] bg-[#F4EFEB] px-3.5 py-2 text-xs font-medium text-[#1C1917] transition-colors hover:bg-[#EAE4DC]"
            >
              <ArrowLeft
                size={13}
                className={isArabic ? "rotate-180" : ""}
                aria-hidden
              />
              <span>{dict.backToStore}</span>
            </Link>
          </div>

          <LocaleSwitcher current={locale} />
        </header>

        <main className="flex flex-1 flex-col items-center justify-start pt-1 sm:pt-3 lg:pt-3 pb-0">
          <div className="w-full max-w-[400px]">{children}</div>
        </main>

        <footer className="shrink-0 text-center text-xs font-light text-[#8C827A]">
          © {new Date().getFullYear()}{" "}
          {isArabic
            ? "وهج — شموع صويا طبيعية مصنوعة يدوياً"
            : "Wahaj Handmade Soy Candles"}
        </footer>
      </div>

      {/* Column 2: Locked Full-Height Editorial Cover */}
      <aside className="relative hidden overflow-hidden bg-[#EBE4D8] lg:block lg:h-full">
        <Image
          src="/brand/hero-candle.jpg"
          alt={
            isArabic
              ? "شمعة وهج بخشب الصندل والعنبر على قاعدة حجرية"
              : "Wahaj Sandalwood & Amber handmade soy candle on natural stone"
          }
          fill
          loading="eager"
          sizes="50vw"
          className="object-cover object-center"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-[#161412]/80 via-[#161412]/10 to-transparent"
        />
        <div className="relative z-10 flex h-full flex-col justify-end p-10 xl:p-12 text-[#F7F4EE]">
          <div className="max-w-md rounded-3xl border border-white/15 bg-[#161412]/45 p-6 backdrop-blur-md shadow-[0_20px_50px_-15px_rgba(0,0,0,0.45)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium text-[#E5A776]">
              <Sparkles size={12} aria-hidden />
              <span className={isArabic ? "" : "uppercase tracking-[0.2em]"}>
                {dict.authShowcaseKicker}
              </span>
            </div>
            <p className="mt-3 font-editorial text-2xl font-bold leading-snug text-white">
              {dict.authShowcaseQuote}
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
