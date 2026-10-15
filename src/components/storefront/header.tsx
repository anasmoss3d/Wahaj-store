import Image from "next/image";
import Link from "next/link";
import { Heart, Search, ShoppingBag, UserRound } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/storefront/locale-switcher";
import { getCartView } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary, getLocale } from "@/lib/i18n";

export async function StorefrontHeader() {
  const [cart, user, locale, dict] = await Promise.all([
    getCartView(),
    getCurrentUser(),
    getLocale(),
    getDictionary()
  ]);

  return (
    <header className="sticky top-0 z-40 border-b border-concrete-100 bg-wahaj-pearl/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 pb-3 pt-3">
        <div className="flex items-center justify-between gap-2">
          <Link className="flex min-w-0 items-center gap-2 sm:gap-3" href="/">
            <Image
              alt="Wahaj logo"
              className="h-10 w-10 shrink-0 rounded-full object-cover sm:h-12 sm:w-12"
              height={96}
              src="/brand/wahaj-logo.jpg"
              width={96}
              priority
            />
            <span className="grid min-w-0">
              <span className="truncate text-base font-bold text-concrete-900 sm:text-lg">
                {dict.storeNameFull}
              </span>
              <span className="hidden text-xs text-concrete-500 sm:block">{dict.brandSub}</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-concrete-700 md:flex">
            <Link href="/products">{dict.products}</Link>
            <Link href="/orders">{dict.trackOrder}</Link>
            <Link href="/#customization">{dict.customization}</Link>
          </nav>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <LocaleSwitcher current={locale} />
            {user ? (
              <ButtonLink className="px-2 sm:px-3" href="/wishlist" variant="ghost" aria-label={dict.wishlist}>
                <Heart aria-hidden size={18} />
              </ButtonLink>
            ) : null}
            <ButtonLink className="px-2 sm:px-3" href={user ? "/account" : "/auth/login"} variant="ghost">
              <UserRound aria-hidden size={18} />
              <span className="hidden sm:inline">{user ? dict.account : dict.login}</span>
            </ButtonLink>
            <ButtonLink className="px-2 sm:px-3" href="/cart" variant="secondary" aria-label={dict.cart}>
              <ShoppingBag aria-hidden size={18} />
              <span>{cart.count}</span>
            </ButtonLink>
          </div>
        </div>
        <form action="/products" className="mt-2 md:hidden" role="search">
          <span className="relative block">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-concrete-400" size={18} />
            <input
              className="min-h-11 w-full rounded-md border border-concrete-200 bg-white ps-10 pe-3 text-sm"
              name="q"
              placeholder={dict.searchPlaceholder}
            />
          </span>
        </form>
      </div>
    </header>
  );
}
