import { AdminNav } from "@/components/admin/admin-nav";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-concrete-50 lg:flex">
      <AdminNav />
      <main className="flex-1 px-4 py-8 lg:px-8">{children}</main>
    </div>
  );
}
