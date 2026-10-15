import { CustomerLoginForm } from "@/components/storefront/auth-forms";
import { StorefrontFooter } from "@/components/storefront/footer";
import { StorefrontHeader } from "@/components/storefront/header";
import { getDictionary } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const dict = await getDictionary();
  return (
    <>
      <StorefrontHeader />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-3xl font-bold text-concrete-900">{dict.customerLogin}</h1>
        <div className="mt-6 rounded-md border border-concrete-100 bg-white p-6 shadow-soft">
          <CustomerLoginForm labels={dict} />
        </div>
        <p className="mt-5 text-sm text-concrete-600">
          {dict.newToWahaj}{" "}
          <a className="font-semibold text-wahaj-teal" href="/auth/register">
            {dict.createAccount}
          </a>
        </p>
      </main>
      <StorefrontFooter />
    </>
  );
}
