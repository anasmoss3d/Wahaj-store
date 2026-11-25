import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { getAdminDictionary } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function AdminForbiddenPage() {
  await requireAdmin();
  const dict = await getAdminDictionary();

  return (
    <AdminShell>
      <div className="mx-auto max-w-lg rounded-3xl border border-[#E5DDD0] bg-white p-8 text-center shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-700">
          <ShieldAlert size={20} aria-hidden />
        </div>
        <h1 className="mt-4 font-editorial text-2xl sm:text-3xl font-black text-[#1C1917]">
          {dict.forbidden.title}
        </h1>
        <p className="mt-2 text-sm font-light leading-relaxed text-[#665E57]">
          {dict.forbidden.description}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#DED7CB] bg-white px-5 text-sm font-medium text-[#1C1917] transition hover:border-[#B85A2D] hover:text-[#B85A2D]"
          >
            {dict.forbidden.viewStorefront}
          </Link>
          <form action={logoutAction}>
            <Button type="submit" variant="secondary">
              {dict.forbidden.signOut}
            </Button>
          </form>
        </div>
      </div>
    </AdminShell>
  );
}
