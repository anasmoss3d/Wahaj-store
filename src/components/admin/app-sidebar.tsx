"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Package,
  Palette,
  Plus,
  Puzzle,
  Ruler,
  Settings,
  ShoppingBag,
  Star,
  Tags,
  TicketPercent,
  type LucideIcon
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { useAdminI18n } from "@/components/admin/admin-i18n-context";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar
} from "@/components/ui/sidebar";
import { getAdminRoleLabel } from "@/lib/admin-i18n";
import { PERMISSIONS, type PermissionKey } from "@/lib/rbac";
import { cn } from "@/lib/utils";

export interface AdminSidebarUser {
  name: string;
  email: string;
  roleName: string;
  permissions: string[];
}

interface NavItem {
  href: string;
  labelKey:
    | "overview"
    | "orders"
    | "products"
    | "categories"
    | "colors"
    | "sizes"
    | "addons"
    | "coupons"
    | "reviews"
    | "settings";
  icon: LucideIcon;
  permission?: PermissionKey;
  exact?: boolean;
  quickAction?: {
    href: string;
    labelKey: "newProduct";
    icon: LucideIcon;
  };
}

interface NavGroup {
  labelKey: "atelier" | "catalog" | "storefront";
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    labelKey: "atelier",
    items: [
      {
        href: "/admin",
        labelKey: "overview",
        icon: LayoutDashboard,
        permission: PERMISSIONS.DASHBOARD_READ,
        exact: true
      },
      {
        href: "/admin/orders",
        labelKey: "orders",
        icon: ShoppingBag,
        permission: PERMISSIONS.ORDERS_MANAGE
      }
    ]
  },
  {
    labelKey: "catalog",
    items: [
      {
        href: "/admin/products",
        labelKey: "products",
        icon: Package,
        permission: PERMISSIONS.PRODUCTS_MANAGE,
        quickAction: {
          href: "/admin/products/new",
          labelKey: "newProduct",
          icon: Plus
        }
      },
      {
        href: "/admin/categories",
        labelKey: "categories",
        icon: Tags,
        permission: PERMISSIONS.PRODUCTS_MANAGE
      },
      {
        href: "/admin/colors",
        labelKey: "colors",
        icon: Palette,
        permission: PERMISSIONS.PRODUCTS_MANAGE
      },
      {
        href: "/admin/sizes",
        labelKey: "sizes",
        icon: Ruler,
        permission: PERMISSIONS.PRODUCTS_MANAGE
      },
      {
        href: "/admin/addons",
        labelKey: "addons",
        icon: Puzzle,
        permission: PERMISSIONS.PRODUCTS_MANAGE
      }
    ]
  },
  {
    labelKey: "storefront",
    items: [
      {
        href: "/admin/coupons",
        labelKey: "coupons",
        icon: TicketPercent,
        permission: PERMISSIONS.MARKETING_MANAGE
      },
      {
        href: "/admin/reviews",
        labelKey: "reviews",
        icon: Star,
        permission: PERMISSIONS.PRODUCTS_MANAGE
      },
      {
        href: "/admin/settings",
        labelKey: "settings",
        icon: Settings,
        permission: PERMISSIONS.SETTINGS_MANAGE
      }
    ]
  }
];

function isRouteActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "WA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function AppSidebar({
  admin,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  admin?: AdminSidebarUser | null;
}) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const { locale, isArabic, dict } = useAdminI18n();

  const closeMobileDrawer = React.useCallback(() => {
    if (isMobile) setOpenMobile(false);
  }, [isMobile, setOpenMobile]);

  const canAccess = React.useCallback(
    (permission?: PermissionKey) => {
      if (!permission || !admin) return true;
      if (admin.roleName === "Super Admin") return true;
      return admin.permissions.includes(permission);
    },
    [admin]
  );

  const adminName = admin?.name || dict.brand.fallbackAdmin;
  const adminRole = getAdminRoleLabel(
    admin?.roleName || dict.brand.fallbackRole,
    locale
  );
  const adminInitials = getInitials(adminName);

  return (
    <Sidebar
      collapsible="icon"
      variant="inset"
      mobileTitle={dict.nav.mobileSidebarTitle}
      mobileDescription={dict.nav.mobileSidebarDescription}
      {...props}
    >
      <SidebarHeader className="pe-12 md:pe-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={dict.brand.tooltip}
              render={<Link href="/admin" onClick={closeMobileDrawer} />}
              className="hover:bg-white/75"
            >
              <Image
                alt={dict.brand.name}
                className="size-8 shrink-0 rounded-full border border-[#DFD7CB] object-cover shadow-sm"
                height={64}
                src="/brand/wahaj-logo.jpg"
                width={64}
              />
              <div className="grid flex-1 text-start leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-editorial text-base font-black text-[#1C1917]">
                  {dict.brand.name}
                </span>
                <span
                  className={cn(
                    "truncate text-[10px] text-[#8C7A6B]",
                    !isArabic && "uppercase tracking-[0.16em]"
                  )}
                >
                  {dict.brand.subtitle}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) =>
            canAccess(item.permission)
          );
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={group.labelKey}>
              <SidebarGroupLabel className={cn(isArabic && "normal-case tracking-normal text-xs")}>
                {dict.nav.groups[group.labelKey]}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const label = dict.nav[item.labelKey];
                    const active = isRouteActive(pathname, item.href, item.exact);
                    const QuickIcon = item.quickAction?.icon;
                    const quickLabel = item.quickAction
                      ? dict.nav[item.quickAction.labelKey]
                      : "";

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          isActive={active}
                          tooltip={label}
                          render={
                            <Link href={item.href} onClick={closeMobileDrawer} />
                          }
                        >
                          <Icon />
                          <span>{label}</span>
                        </SidebarMenuButton>
                        {item.quickAction && QuickIcon ? (
                          <SidebarMenuAction
                            showOnHover
                            title={quickLabel}
                            render={
                              <Link
                                href={item.quickAction.href}
                                onClick={closeMobileDrawer}
                              />
                            }
                          >
                            <QuickIcon />
                            <span className="sr-only">{quickLabel}</span>
                          </SidebarMenuAction>
                        ) : null}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip={dict.nav.viewStorefront}
                  render={<Link href="/" onClick={closeMobileDrawer} />}
                >
                  <ExternalLink className={cn(isArabic && "-scale-x-100")} />
                  <span>{dict.nav.viewStorefront}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={`${adminName} · ${adminRole}`}
              className="cursor-default hover:bg-transparent active:bg-transparent"
              tabIndex={-1}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#DED7CB] bg-[#EDE7DD] text-xs font-bold text-[#1C1917]">
                {adminInitials}
              </span>
              <div className="grid flex-1 text-start leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-xs font-semibold text-[#1C1917]">
                  {adminName}
                </span>
                <span className="truncate text-[11px] text-[#78716C]">
                  {adminRole}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action={logoutAction} className="w-full">
              <SidebarMenuButton
                type="submit"
                tooltip={dict.nav.signOut}
                className="text-[#665E57] hover:bg-red-50 hover:text-red-700 hover:[&>svg]:text-red-700"
              >
                <LogOut className={cn(isArabic && "rotate-180")} />
                <span>{dict.nav.signOut}</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail label={dict.nav.toggleSidebar} />
    </Sidebar>
  );
}
