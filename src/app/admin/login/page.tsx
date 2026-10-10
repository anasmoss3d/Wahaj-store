import Image from "next/image";
import { AdminLoginForm } from "@/components/storefront/auth-forms";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <Image
            alt="Wahaj"
            className="h-14 w-14 rounded-full object-cover"
            height={96}
            src="/brand/wahaj-logo.jpg"
            width={96}
          />
          <div>
            <h1 className="text-2xl font-bold text-concrete-900">Wahaj Admin</h1>
            <p className="text-sm text-concrete-500">Protected dashboard</p>
          </div>
        </div>
        <AdminLoginForm />
      </div>
    </main>
  );
}
