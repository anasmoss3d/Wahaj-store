import { LayoutDashboard, Package, Palette, Puzzle, Settings, ShoppingBag, Star, Tags, TicketPercent } from "lucide-react";
import { adminLogoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/colors", label: "Colors", icon: Palette },
  { href: "/admin/addons", label: "Add-ons", icon: Puzzle },
  { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/settings", label: "Settings", icon: Settings }
];

export function AdminNav() {
  return (
    <aside className="sticky top-0 z-40 border-b border-concrete-100 bg-white lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-e">
      <div className="flex items-center gap-3 p-4 lg:grid lg:gap-5">
        <a className="shrink-0 text-lg font-bold text-concrete-900 lg:text-xl" href="/admin">
          Wahaj Admin
        </a>
        <nav className="flex flex-1 gap-1 overflow-x-auto lg:grid lg:flex-none">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <a
                className="flex min-h-11 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold text-concrete-700 hover:bg-concrete-50"
                href={link.href}
                key={link.href}
              >
                <Icon size={18} />
                <span className="hidden sm:inline">{link.label}</span>
              </a>
            );
          })}
        </nav>
        <form action={adminLogoutAction} className="shrink-0">
          <Button className="px-3" type="submit" variant="ghost">
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  );
}
