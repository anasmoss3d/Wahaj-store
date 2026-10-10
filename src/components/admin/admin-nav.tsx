import { LayoutDashboard, Package, Palette, Puzzle, Settings, ShoppingBag, Tags } from "lucide-react";
import { adminLogoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/colors", label: "Colors", icon: Palette },
  { href: "/admin/addons", label: "Add-ons", icon: Puzzle },
  { href: "/admin/settings", label: "Settings", icon: Settings }
];

export function AdminNav() {
  return (
    <aside className="border-b border-concrete-100 bg-white lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-e">
      <div className="grid gap-5 p-4 lg:sticky lg:top-0">
        <a className="text-xl font-bold text-concrete-900" href="/admin">
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
        <form action={adminLogoutAction}>
          <Button className="w-full" type="submit" variant="ghost">
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  );
}
