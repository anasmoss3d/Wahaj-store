"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { useAdminI18n } from "@/components/admin/admin-i18n-context";
import { LocaleSwitcher } from "@/components/storefront/locale-switcher";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

function getPageLabel(
  pathname: string,
  nav: ReturnType<typeof useAdminI18n>["dict"]["nav"]
) {
  switch (pathname) {
    case "/admin":
      return nav.overview;
    case "/admin/orders":
      return nav.orders;
    case "/admin/products":
      return nav.products;
    case "/admin/products/new":
      return nav.newProduct;
    case "/admin/categories":
      return nav.categories;
    case "/admin/colors":
      return nav.colors;
    case "/admin/sizes":
      return nav.sizes;
    case "/admin/addons":
      return nav.addons;
    case "/admin/coupons":
      return nav.coupons;
    case "/admin/reviews":
      return nav.reviews;
    case "/admin/settings":
      return nav.settings;
    default:
      if (pathname.startsWith("/admin/orders/")) return nav.orderDetails;
      if (pathname.startsWith("/admin/products/")) return nav.editProduct;
      return nav.dashboard;
  }
}

export function AdminTopbar() {
  const pathname = usePathname();
  const { locale, dict } = useAdminI18n();
  const pageLabel = getPageLabel(pathname, dict.nav);

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[#E8E2D8] bg-[#F7F4EE]/90 px-4 backdrop-blur-md sm:px-6 md:rounded-t-2xl">
      <div className="flex min-w-0 items-center gap-2.5">
        <SidebarTrigger
          label={dict.nav.toggleSidebar}
          title={dict.nav.toggleSidebarShortcut}
        />
        <Separator orientation="vertical" className="h-4" />
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
          <Link
            href="/admin"
            className="hidden shrink-0 text-xs font-medium text-[#8C7A6B] transition-colors hover:text-[#1C1917] sm:inline"
          >
            {dict.brand.subtitle}
          </Link>
          <span className="hidden text-xs text-[#C7BDB0] sm:inline">/</span>
          <span className="truncate font-medium text-[#1C1917]">{pageLabel}</span>
        </nav>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <LocaleSwitcher current={locale} />
        <Link
          href="/admin/products/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#DED7CB] bg-white px-3.5 text-xs font-medium text-[#1C1917] shadow-sm transition hover:border-[#B85A2D] hover:text-[#B85A2D]"
        >
          <Plus className="h-3.5 w-3.5 text-[#B85A2D]" />
          <span className="hidden sm:inline">{dict.nav.newProduct}</span>
          <span className="sm:hidden">{dict.nav.newShort}</span>
        </Link>
      </div>
    </header>
  );
}
