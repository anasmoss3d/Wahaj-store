import { CustomerRegisterForm } from "@/components/storefront/auth-forms";
import { StorefrontFooter } from "@/components/storefront/footer";
import { StorefrontHeader } from "@/components/storefront/header";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <>
      <StorefrontHeader />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-3xl font-bold text-concrete-900">Create account</h1>
        <div className="mt-6 rounded-md border border-concrete-100 bg-white p-6 shadow-soft">
          <CustomerRegisterForm />
        </div>
        <p className="mt-5 text-sm text-concrete-600">
          Already registered? <a className="font-semibold text-wahaj-teal" href="/auth/login">Sign in</a>
        </p>
      </main>
      <StorefrontFooter />
    </>
  );
}
