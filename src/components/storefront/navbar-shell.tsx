"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Search, ShoppingBag, UserRound } from "lucide-react";
import { LocaleSwitcher } from "@/components/storefront/locale-switcher";
import { MobileNav } from "@/components/storefront/mobile-nav";
import type { Dictionary, Locale } from "@/lib/i18n";

interface NavbarShellProps {
  locale: Locale;
  dict: Dictionary;
  user: { id: string; name?: string | null; email?: string | null } | null;
  isAdmin?: boolean;
  cartCount: number;
  whatsappNumber?: string;
}

export function NavbarShell({
  locale,
  dict,
  user,
  isAdmin = false,
  cartCount,
  whatsappNumber
}: NavbarShellProps) {
  const [scrolled, setScrolled] = useState(false);
  const isArabic = locale === "ar";

  useEffect(() => {
    const updateScroll = () => {
      const y = window.scrollY;
      setScrolled((prev) => {
        if (!prev && y > 28) return true;
        if (prev && y < 10) return false;
        return prev;
      });
    };

    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    return () => window.removeEventListener("scroll", updateScroll);
  }, []);

  const navLinks = [
    { href: "/products?category=candles", label: dict.navCandles || (isArabic ? "الشموع" : "Candles") },
    { href: "/#scent-moments", label: dict.navCurated || (isArabic ? "مختارات" : "Curated") },
    { href: "/#collection", label: dict.navCollection || (isArabic ? "المجموعة" : "Collection") },
    { href: "/#craft", label: dict.navCraft || (isArabic ? "حرفتنا" : "Craft") }
  ];

  const surfacePillClass = scrolled
    ? "border-white/70 bg-white/55 hover:bg-white/85"
    : "border-[#E8E2D8] bg-[#F4EFEB] hover:bg-[#EAE4DC]";

  return (
    <>
      {/* Static flow spacer prevents layout jump when navbar floats on scroll */}
      <div aria-hidden className="h-[62px] sm:h-[66px] w-full" />

      <header
        className={`fixed top-0 inset-x-0 z-40 pointer-events-none transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          scrolled ? "px-3 pt-3 sm:px-6 sm:pt-4" : "px-0 pt-0"
        }`}
      >
        <div
          className={`mx-auto w-full pointer-events-auto border backdrop-blur-xl transition-[max-width,border-radius,background-color,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            scrolled
              ? "max-w-[72rem] rounded-[32px] border-white/70 bg-[#F7F4EE]/75 shadow-[0_14px_40px_-10px_rgba(28,25,23,0.16),inset_0_1px_0_rgba(255,255,255,0.7)]"
              : "max-w-[120rem] rounded-[0px] border-t-transparent border-x-transparent border-b-[#E8E2D8] bg-[#F7F4EE]/95 shadow-[0_0_0_0_rgba(28,25,23,0)]"
          }`}
        >
          <div
            className={`mx-auto flex max-w-7xl items-center justify-between gap-3 transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              scrolled ? "px-3 py-2 sm:px-5" : "px-4 py-3 sm:px-6"
            }`}
          >
            {/* Logo Only (No text beside it) + Mobile Drawer Trigger */}
            <div className="flex items-center gap-2 sm:gap-3">
              <MobileNav
                dict={dict}
                locale={locale}
                user={user}
                isAdmin={isAdmin}
                cartCount={cartCount}
                whatsappNumber={whatsappNumber}
              />
              <Link
                href="/"
                aria-label={dict.storeNameFull || "Wahaj"}
                className="group inline-flex shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B85A2D]/30"
              >
                <span className="relative block h-9 w-9 sm:h-10 sm:w-10 overflow-hidden rounded-full border border-[#DFD7CB] shadow-sm transition-transform duration-300 group-hover:scale-105">
                  <Image
                    alt="Wahaj"
                    className="object-cover"
                    fill
                    priority
                    sizes="40px"
                    src="/brand/wahaj-logo.jpg"
                  />
                </span>
              </Link>
            </div>

            {/* Focused Modern Navigation Links */}
            <nav className="hidden lg:flex items-center gap-7 xl:gap-9 text-[13px] font-medium text-[#57534E]">
              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative whitespace-nowrap py-1 transition-colors duration-200 hover:text-[#1C1917] after:absolute after:inset-x-0 after:bottom-0 after:h-[1.5px] after:origin-center after:scale-x-0 after:rounded-full after:bg-[#B85A2D] after:transition-transform after:duration-300 hover:after:scale-x-100"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Unified Action Controls (All matching h-9 sm:h-10) */}
            <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
              {/* Search Pill */}
              <form action="/products" method="GET" role="search" className="relative">
                <span className="relative flex items-center">
                  <Search
                    className="absolute start-3 pointer-events-none text-[#8C827A]"
                    size={14}
                  />
                  <input
                    name="q"
                    type="search"
                    placeholder={isArabic ? "ابحث عن الشموع..." : "Search scents..."}
                    className={`h-9 sm:h-10 w-28 sm:w-40 lg:w-48 rounded-full border ps-9 pe-3 text-xs text-[#1C1917] placeholder:text-[#8C827A] outline-none transition-all duration-300 focus:w-36 sm:focus:w-48 lg:focus:w-56 focus:bg-white focus:border-[#B85A2D] focus:ring-2 focus:ring-[#B85A2D]/15 ${
                      scrolled ? "border-white/70 bg-white/55" : "border-[#E8E2D8] bg-[#F4EFEB]"
                    }`}
                  />
                </span>
              </form>

              {/* Locale Dropdown */}
              <div className="hidden sm:block">
                <LocaleSwitcher current={locale} glassy={scrolled} />
              </div>

              {user ? (
                <Link
                  href="/wishlist"
                  aria-label={dict.wishlist}
                  className={`inline-flex h-9 sm:h-10 w-9 sm:w-10 items-center justify-center rounded-full border text-[#1C1917] transition-all duration-300 ${surfacePillClass}`}
                >
                  <Heart aria-hidden size={15} />
                </Link>
              ) : null}

              <Link
                href={isAdmin ? "/admin" : user ? "/account" : "/auth/login"}
                aria-label={isAdmin ? dict.admin : user ? dict.account : dict.login}
                className={`inline-flex h-9 sm:h-10 items-center gap-1.5 rounded-full border px-3 sm:px-3.5 text-xs font-medium text-[#1C1917] transition-all duration-300 ${surfacePillClass}`}
              >
                <UserRound aria-hidden size={14} />
                <span className="hidden sm:inline whitespace-nowrap">
                  {isAdmin ? dict.admin : user ? dict.account : dict.login}
                </span>
              </Link>

              <Link
                href="/cart"
                aria-label={dict.cart}
                className="inline-flex h-9 sm:h-10 items-center gap-1.5 rounded-full bg-[#1C1917] px-3.5 sm:px-4 text-xs font-semibold text-white shadow-sm transition-all duration-300 hover:bg-[#2E2825] active:scale-[0.98]"
              >
                <ShoppingBag aria-hidden size={14} />
                <span>{cartCount}</span>
              </Link>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
