import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, UserRound } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { getCartView } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";

export async function StorefrontHeader() {
  const [cart, user] = await Promise.all([getCartView(), getCurrentUser()]);

  return (
    <header className="sticky top-0 z-40 border-b border-concrete-100 bg-wahaj-pearl/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link className="flex items-center gap-3" href="/">
          <Image
            alt="Wahaj logo"
            className="h-12 w-12 rounded-full object-cover"
            height={96}
            src="/brand/wahaj-logo.jpg"
            width={96}
            priority
          />
          <span className="grid">
            <span className="text-lg font-bold text-concrete-900">وهج | Wahaj</span>
            <span className="text-xs text-concrete-500">Concrete decor</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-concrete-700 md:flex">
          <Link href="/products">Products</Link>
          <Link href="/orders">Track order</Link>
          <Link href="/#customization">Customization</Link>
        </nav>
        <div className="flex items-center gap-2">
          <ButtonLink className="px-3" href={user ? "/account" : "/auth/login"} variant="ghost">
            <UserRound aria-hidden size={18} />
            <span className="hidden sm:inline">{user ? "Account" : "Login"}</span>
          </ButtonLink>
          <ButtonLink className="px-3" href="/cart" variant="secondary">
            <ShoppingBag aria-hidden size={18} />
            <span>{cart.count}</span>
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
