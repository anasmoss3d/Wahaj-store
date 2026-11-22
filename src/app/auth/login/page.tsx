import { CustomerLoginForm } from "@/components/storefront/auth-forms";
import { StorefrontFooter } from "@/components/storefront/footer";
import { StorefrontHeader } from "@/components/storefront/header";
import { getDictionary } from "@/lib/i18n";
import { safeNextPath } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ next?: string | string[] }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const [params, dict] = await Promise.all([searchParams, getDictionary()]);
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const next = safeNextPath(rawNext, "");
  const needsCheckout = next.startsWith("/checkout");

  return (
    <>
      <StorefrontHeader />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-3xl font-bold text-concrete-900">{dict.customerLogin}</h1>
        {needsCheckout ? (
          <p className="mt-5 rounded-md border border-wahaj-teal/20 bg-wahaj-teal/5 p-4 text-sm leading-6 text-concrete-700">
            {dict.checkoutLoginNotice}
          </p>
        ) : null}
        <div className="mt-6 rounded-md border border-concrete-100 bg-white p-6 shadow-soft">
          <CustomerLoginForm labels={dict} next={next || undefined} />
        </div>
        <p className="mt-5 text-sm text-concrete-600">
          {dict.newToWahaj}{" "}
          <a
            className="font-semibold text-wahaj-teal"
            href={next ? `/auth/register?next=${encodeURIComponent(next)}` : "/auth/register"}
          >
            {dict.createAccount}
          </a>
        </p>
      </main>
      <StorefrontFooter />
    </>
  );
}
