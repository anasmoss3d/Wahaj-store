import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthPortal } from "@/components/storefront/auth/auth-portal";
import { getCurrentAdmin, getCurrentUser } from "@/lib/auth";
import { getDictionary, getLocale } from "@/lib/i18n";
import { sanitizeNextPath, sanitizeNextQueryParam } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.signIn };
}

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string; reset?: string }>;
}) {
  const [{ next, reset }, admin, user, dict, locale] = await Promise.all([
    searchParams,
    getCurrentAdmin(),
    getCurrentUser(),
    getDictionary(),
    getLocale()
  ]);

  if (admin) {
    redirect(sanitizeNextPath(next, { role: "admin" }));
  }

  const safeNext = sanitizeNextQueryParam(next);
  const targetsAdmin = Boolean(safeNext && (safeNext === "/admin" || safeNext.startsWith("/admin/")));

  if (user && !targetsAdmin) {
    redirect(sanitizeNextPath(next, { role: "customer" }));
  }

  return (
    <AuthPortal
      initialMode="login"
      labels={dict}
      locale={locale}
      safeNext={safeNext}
      resetSuccess={reset === "1"}
    />
  );
}
