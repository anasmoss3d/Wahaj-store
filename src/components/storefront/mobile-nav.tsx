"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Menu,
  ShoppingBag,
  Package,
  Clock,
  Paintbrush,
  UserRound,
  Heart,
  MessageCircle,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { LocaleSwitcher } from "@/components/storefront/locale-switcher";
import type { Dictionary, Locale } from "@/lib/i18n";

interface MobileNavProps {
  dict: Dictionary;
  locale: Locale;
  user: { id: string; name?: string | null; email?: string | null } | null;
  isAdmin?: boolean;
  cartCount: number;
  whatsappNumber?: string;
}

export function MobileNav({
  dict,
  locale,
  user,
  isAdmin = false,
  cartCount,
  whatsappNumber = "+201000000000"
}: MobileNavProps) {
  const [open, setOpen] = React.useState(false);

  const links = [
    { href: "/", label: locale === "ar" ? "الرئيسية" : "Home", icon: Home },
    { href: "/products", label: dict.products, icon: Package },
    { href: "/orders", label: dict.trackOrder, icon: Clock },
    { href: "/#craft", label: dict.navCraft || dict.customization, icon: Paintbrush },
    ...(user
      ? [{ href: "/wishlist", label: dict.wishlist, icon: Heart }]
      : []),
    {
      href: isAdmin ? "/admin" : user ? "/account" : "/auth/login",
      label: isAdmin ? dict.admin : user ? dict.account : dict.login,
      icon: UserRound
    },
    {
      href: "/cart",
      label: dict.cart,
      icon: ShoppingBag,
      badge: cartCount > 0 ? cartCount : undefined
    }
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-9 w-9 sm:h-10 sm:w-10 rounded-full text-[#1C1917]"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </Button>
      </SheetTrigger>
      <SheetContent
        side={locale === "ar" ? "right" : "left"}
        className="w-[85%] max-w-sm flex flex-col justify-between overflow-y-auto bg-[#F7F4EE] p-6"
      >
        <div>
          <SheetHeader className="mb-6">
            <div className="flex items-center gap-3">
              <Image
                alt="Wahaj logo"
                className="h-10 w-10 rounded-full border border-[#DFD7CB] object-cover shadow-sm"
                height={80}
                src="/brand/wahaj-logo.jpg"
                width={80}
              />
              <div className="text-start">
                <SheetTitle className="font-editorial text-lg font-bold text-[#1C1917]">
                  {dict.storeNameFull}
                </SheetTitle>
                <p className="text-xs text-[#78716C] font-light">{dict.brandSub}</p>
              </div>
            </div>
          </SheetHeader>

          {/* Drawer Search */}
          <form action="/products" method="GET" className="mb-6" onSubmit={() => setOpen(false)}>
            <div className="relative">
              <input
                type="search"
                name="q"
                placeholder={dict.searchPlaceholder || "Search..."}
                className="w-full h-10 rounded-full border border-[#DED7CB] bg-white px-4 text-xs text-[#1C1917] placeholder:text-[#A8A29E] outline-none transition-all focus:border-[#B85A2D] focus:ring-2 focus:ring-[#B85A2D]/20"
              />
            </div>
          </form>

          <nav className="grid gap-1.5">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center justify-between rounded-2xl px-3.5 text-sm font-medium text-[#1C1917] transition-all hover:bg-white hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className="text-[#B85A2D]" strokeWidth={1.75} />
                    <span>{link.label}</span>
                  </div>
                  {link.badge ? (
                    <Badge className="h-6 px-2.5 text-xs font-bold">
                      {link.badge}
                    </Badge>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-8 space-y-4">
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#665E57]">
              {dict.language || "اللغة"}
            </span>
            <LocaleSwitcher current={locale} dropUp />
          </div>
          <a
            href={`https://wa.me/${whatsappNumber.replace(/[^\d]/g, "")}`}
            rel="noopener"
            target="_blank"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1C1917] px-5 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:bg-[#B85A2D]"
          >
            <MessageCircle size={18} className="text-[#E5A776]" />
            <span>{dict.whatsapp}</span>
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
