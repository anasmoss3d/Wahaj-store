import { CustomerLoginForm } from "@/components/storefront/auth-forms";
import { StorefrontFooter } from "@/components/storefront/footer";
import { StorefrontHeader } from "@/components/storefront/header";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <>
      <StorefrontHeader />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-3xl font-bold text-concrete-900">Customer login</h1>
        <div className="mt-6 rounded-md border border-concrete-100 bg-white p-6 shadow-soft">
          <CustomerLoginForm />
        </div>
        <p className="mt-5 text-sm text-concrete-600">
          New to Wahaj? <a className="font-semibold text-wahaj-teal" href="/auth/register">Create an account</a>
        </p>
      </main>
      <StorefrontFooter />
    </>
  );
}
