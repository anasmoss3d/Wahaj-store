import type { Metadata } from "next";
import { AuthPortal } from "@/components/storefront/auth/auth-portal";
import { getDictionary, getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.resetPasswordTitle };
}

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const [{ token }, dict, locale] = await Promise.all([
    searchParams,
    getDictionary(),
    getLocale()
  ]);

  return (
    <AuthPortal
      initialMode="reset"
      labels={dict}
      locale={locale}
      resetToken={typeof token === "string" ? token : ""}
    />
  );
}
