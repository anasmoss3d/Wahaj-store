import Image from "next/image";
import Link from "next/link";
import { Flame, Mail, MessageCircle, ShoppingBag } from "lucide-react";
import { getStoreSettings } from "@/lib/settings";
import { getDictionary, getLocale } from "@/lib/i18n";

export async function StorefrontFooter() {
  const [settings, dict, locale] = await Promise.all([
    getStoreSettings(),
    getDictionary(),
    getLocale()
  ]);

  const isArabic = locale === "ar";
  const cleanPhone = settings.whatsappNumber.replace(/[^\d]/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone}`;
  const mailUrl = `mailto:${settings.contactEmail}`;

  const iconButtons = [
    {
      href: whatsappUrl,
      label: dict.whatsapp || (isArabic ? "واتساب" : "WhatsApp"),
      icon: MessageCircle,
      external: true
    },
    {
      href: mailUrl,
      label: settings.contactEmail,
      icon: Mail,
      external: true
    },
    {
      href: "/products?category=candles",
      label: dict.filterCandles || (isArabic ? "الشموع" : "Candles"),
      icon: Flame,
      external: false
    },
    {
      href: "/cart",
      label: dict.cart || (isArabic ? "السلة" : "Cart"),
      icon: ShoppingBag,
      external: false
    }
  ];

  const columns = [
    {
      heading: isArabic ? "المجموعة" : "Collection",
      links: [
        { href: "/products?category=candles", label: dict.filterCandles || (isArabic ? "الشموع" : "Soy Candles") },
        { href: "/#scent-moments", label: dict.navCurated || (isArabic ? "مختارات" : "Curated") },
        { href: "/#curated", label: dict.curatedTitle || (isArabic ? "لحظات هادئة" : "Quiet Moments") },
        { href: "/#scents", label: dict.navScents || (isArabic ? "أرشيف الروائح" : "Scent Archive") }
      ]
    },
    {
      heading: isArabic ? "المرسم" : "Atelier",
      links: [
        { href: "/#craft", label: dict.navCraft || (isArabic ? "حرفتنا" : "Our Craft") },
        { href: "/#care", label: dict.navCare || (isArabic ? "دليل العناية" : "Burn Ritual") },
        { href: "/#faq", label: dict.navFaq || (isArabic ? "معلومات تهمك" : "Good to Know") }
      ]
    },
    {
      heading: isArabic ? "خدمة العملاء" : "Care & Orders",
      links: [
        { href: "/orders", label: dict.trackOrder || (isArabic ? "تتبع الطلب" : "Track Order") },
        { href: "/cart", label: dict.cart || (isArabic ? "السلة" : "Shopping Bag") },
        { href: "/wishlist", label: dict.wishlist || (isArabic ? "المفضلة" : "Wishlist") }
      ]
    }
  ];

  const horizonMeltMask =
    "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 6%, rgba(0,0,0,0.04) 11%, rgba(0,0,0,0.14) 17%, rgba(0,0,0,0.32) 23%, rgba(0,0,0,0.54) 29%, rgba(0,0,0,0.76) 35%, rgba(0,0,0,0.92) 41%, rgba(0,0,0,1) 47%, rgba(0,0,0,1) 100%)";

  return (
    <footer className="relative overflow-hidden bg-[#12130e] text-[#F5EFE6] border-t border-white/10 min-h-[820px] sm:min-h-[960px] lg:min-h-[1060px] xl:min-h-[1140px] flex flex-col justify-between">
      {/* Full-Bleed High-Res Atmospheric Horizon Artwork emerging far below the upper copy */}
      <div className="pointer-events-none select-none absolute inset-x-0 bottom-0 h-[400px] sm:h-[500px] lg:h-[680px] xl:h-[760px]">
        <div
          className="relative w-full h-full"
          style={{
            maskImage: horizonMeltMask,
            WebkitMaskImage: horizonMeltMask
          }}
        >
          <Image
            alt=""
            src="/brand/footer-horizon.webp"
            fill
            unoptimized
            sizes="100vw"
            className="object-cover object-bottom opacity-[0.68] brightness-[0.82] saturate-[0.88]"
          />
        </div>
        {/* Subtle dusk veil softening luminance & melting the lower edge into the dark canvas */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, #12130e 0%, rgba(18,19,14,0.68) 20%, rgba(18,19,14,0.18) 46%, rgba(14,15,11,0.14) 76%, rgba(10,10,8,0.80) 100%)"
          }}
        />
      </div>

      {/* Main Footer Content resting on clean empty dark space with generous room above & below */}
      <div className="relative z-10 w-full mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 pt-20 sm:pt-28 lg:pt-36 pb-[420px] sm:pb-[480px] lg:pb-[540px] xl:pb-[580px]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-10">
          
          {/* Brand Logo + Tagline + 4 Circular Glass Action Icons */}
          <div className="md:col-span-5 flex flex-col items-start">
            <Link
              href="/"
              aria-label={dict.storeNameFull || "Wahaj"}
              className="group inline-flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A776]/50"
            >
              <span className="relative block h-11 w-11 overflow-hidden rounded-full border border-white/20 shadow-sm transition-transform duration-300 group-hover:scale-105">
                <Image
                  alt="Wahaj"
                  src="/brand/wahaj-logo.jpg"
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              </span>
            </Link>

            <p className="mt-5 max-w-xs text-xs sm:text-sm leading-relaxed text-[#D8D0C4]/85 font-light">
              {isArabic
                ? "وهج — دفء اللمسة اليدوية والسكينة التي تملأ منزلك. شموع صويا طبيعية ١٠٠٪ مسكوبة بتأنٍ."
                : "Wahaj — the warmth of the handmade and the quietude that fills your home."}
            </p>

            {/* 4 Circular Glassy Icon Buttons */}
            <div className="mt-7 flex items-center gap-3">
              {iconButtons.map((btn) => {
                const Icon = btn.icon;
                const className =
                  "inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-[#EAE2D6] backdrop-blur-md transition-all duration-300 hover:bg-white/15 hover:border-[#E5A776]/60 hover:text-white active:scale-95";

                if (btn.external) {
                  return (
                    <a
                      key={btn.label}
                      href={btn.href}
                      target={btn.href.startsWith("http") ? "_blank" : undefined}
                      rel={btn.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      aria-label={btn.label}
                      className={className}
                    >
                      <Icon size={16} strokeWidth={1.6} />
                    </a>
                  );
                }

                return (
                  <Link key={btn.label} href={btn.href} aria-label={btn.label} className={className}>
                    <Icon size={16} strokeWidth={1.6} />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 3 Clean Navigation Link Columns */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 lg:gap-12">
            {columns.map((col) => (
              <div key={col.heading} className="flex flex-col gap-3">
                <span className="text-xs sm:text-sm font-semibold text-white mb-1">
                  {col.heading}
                </span>
                <ul className="space-y-2.5 text-xs sm:text-sm text-[#CEC6BA]/80 font-light">
                  {col.links.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="transition-colors duration-200 hover:text-white"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Delicate Bottom Copyright & Contact Bar */}
      <div className="relative z-10 w-full mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 pb-6 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#E5DDD2]/75">
        <p>© {new Date().getFullYear()} Wahaj Handmade Candles. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <a href={mailUrl} dir="ltr" className="hover:text-white transition-colors">
            {settings.contactEmail}
          </a>
          <span aria-hidden>•</span>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            {dict.whatsapp || (isArabic ? "واتساب" : "WhatsApp")}
          </a>
        </div>
      </div>
    </footer>
  );
}
