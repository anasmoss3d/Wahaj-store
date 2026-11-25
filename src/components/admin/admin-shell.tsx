import { cookies } from "next/headers";
import { AdminI18nProvider } from "@/components/admin/admin-i18n-context";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { AppSidebar, type AdminSidebarUser } from "@/components/admin/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getCurrentAdmin } from "@/lib/auth";
import { direction, getAdminDictionary, getLocale } from "@/lib/i18n";

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const [cookieStore, admin, locale, dict] = await Promise.all([
    cookies(),
    getCurrentAdmin(),
    getLocale(),
    getAdminDictionary()
  ]);

  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";
  const dir = direction(locale);
  const sidebarSide = dir === "rtl" ? "right" : "left";

  const adminUser: AdminSidebarUser | null = admin
    ? {
        name: admin.name,
        email: admin.email,
        roleName: admin.role.name,
        permissions: admin.role.permissions.map((entry) => entry.permission.key)
      }
    : null;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917]" dir={dir}>
      <AdminI18nProvider locale={locale} dict={dict}>
        <SidebarProvider defaultOpen={defaultOpen} dir={dir}>
          <AppSidebar admin={adminUser} dir={dir} side={sidebarSide} variant="inset" />
          <SidebarInset>
            <AdminTopbar />
            <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AdminI18nProvider>
    </div>
  );
}
