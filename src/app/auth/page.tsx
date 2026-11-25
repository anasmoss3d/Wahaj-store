import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthPortal } from "@/components/storefront/auth/auth-portal";
import { getCurrentAdmin, getCurrentUser } from "@/lib/auth";
import { getDictionary, getLocale } from "@/lib/i18n";
import { sanitizeNextPath, sanitizeNextQueryParam } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: `${dict.signIn} · ${dict.createAccount}` };
}

export default async function AuthPage({
  searchParams
}: {
  searchParams: Promise<{ mode?: string; next?: string; reset?: string; token?: string }>;
}) {
  const [{ mode, next, reset, token }, admin, user, dict, locale] = await Promise.all([
    searchParams,
    getCurrentAdmin(),
    getCurrentUser(),
    getDictionary(),
    getLocale()
  ]);

  const initialMode =
    mode === "register" || mode === "signup"
      ? "register"
      : mode === "reset"
        ? "reset"
        : "login";

  const safeNext = sanitizeNextQueryParam(next);

  if (initialMode !== "reset") {
    if (admin) {
      redirect(sanitizeNextPath(next, { role: "admin" }));
    }
    const targetsAdmin = Boolean(
      safeNext && (safeNext === "/admin" || safeNext.startsWith("/admin/"))
    );
    if (user && !targetsAdmin) {
      redirect(sanitizeNextPath(next, { role: "customer" }));
    }
  }

  return (
    <AuthPortal
      initialMode={initialMode}
      labels={dict}
      locale={locale}
      safeNext={safeNext}
      resetSuccess={reset === "1"}
      resetToken={typeof token === "string" ? token : ""}
      unifiedPath
    />
  );
}
