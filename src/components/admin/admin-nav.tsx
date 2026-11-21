import { LayoutDashboard, Package, Palette, Puzzle, Ruler, Settings, ShoppingBag, Star, Tags, TicketPercent } from "lucide-react";
import { adminLogoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/colors", label: "Colors", icon: Palette },
  { href: "/admin/sizes", label: "Sizes", icon: Ruler },
  { href: "/admin/addons", label: "Add-ons", icon: Puzzle },
  { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/settings", label: "Settings", icon: Settings }
];

export function AdminNav() {
  return (
    <aside className="sticky top-0 z-40 border-b border-concrete-100 bg-white shadow-soft lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-e lg:shadow-none">
      {/* Mobile: brand row + logout, then a scrollable tab strip. */}
      <div className="flex items-center justify-between gap-3 px-4 pt-3 lg:hidden">
        <a className="shrink-0 text-lg font-bold text-concrete-900" href="/admin">
          Wahaj Admin
        </a>
        <form action={adminLogoutAction} className="shrink-0">
          <Button className="px-3" type="submit" variant="ghost">
            Sign out
          </Button>
        </form>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-2 pt-2 lg:hidden">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <a
              className="flex min-h-11 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold text-concrete-700 hover:bg-concrete-50"
              href={link.href}
              key={link.href}
            >
              <Icon size={18} />
              <span>{link.label}</span>
            </a>
          );
        })}
      </nav>

      {/* Desktop: vertical sidebar with brand, links, logout. */}
      <div className="hidden flex-col gap-1 p-5 lg:grid">
        <a className="mb-6 text-xl font-bold text-concrete-900" href="/admin">
          Wahaj Admin
        </a>
        <nav className="grid gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <a
                className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold text-concrete-700 hover:bg-concrete-50"
                href={link.href}
                key={link.href}
              >
                <Icon size={18} />
                {link.label}
              </a>
            );
          })}
        </nav>
        <form action={adminLogoutAction} className="mt-6">
          <Button className="w-full" type="submit" variant="ghost">
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  );
}
