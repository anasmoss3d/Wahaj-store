import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthPortal } from "@/components/storefront/auth/auth-portal";
import { getCurrentAdmin, getCurrentUser } from "@/lib/auth";
import { getDictionary, getLocale } from "@/lib/i18n";
import { sanitizeNextPath, sanitizeNextQueryParam } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.createAccount };
}

export default async function RegisterPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [{ next }, admin, user, dict, locale] = await Promise.all([
    searchParams,
    getCurrentAdmin(),
    getCurrentUser(),
    getDictionary(),
    getLocale()
  ]);

  if (admin) {
    redirect("/admin");
  }
  if (user) {
    redirect(sanitizeNextPath(next, { role: "customer" }));
  }

  return (
    <AuthPortal
      initialMode="register"
      labels={dict}
      locale={locale}
      safeNext={sanitizeNextQueryParam(next)}
    />
  );
}
