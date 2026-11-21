import { AdminNav } from "@/components/admin/admin-nav";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-concrete-50 lg:flex" dir="ltr">
      <AdminNav />
      <main className="min-w-0 flex-1 px-4 py-6 sm:py-8 lg:px-8">{children}</main>
    </div>
  );
}
