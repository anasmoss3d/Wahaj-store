import Link from "next/link";
import { StorefrontFooter } from "@/components/storefront/footer";
import { StorefrontHeader } from "@/components/storefront/header";
import { getDictionary } from "@/lib/i18n";

export default async function ProductNotFoundPage() {
  const dict = await getDictionary();
  return (
    <>
      <StorefrontHeader />
      <main className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="text-sm font-bold uppercase tracking-wide text-wahaj-teal">404</p>
        <h1 className="mt-3 text-2xl font-bold text-concrete-900">{dict.productNotFoundTitle}</h1>
        <p className="mt-3 leading-7 text-concrete-600">{dict.productNotFoundHint}</p>
        <Link
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-wahaj-teal px-6 text-sm font-semibold text-white transition hover:opacity-90"
          href="/products"
        >
          {dict.shopProducts}
        </Link>
      </main>
      <StorefrontFooter />
    </>
  );
}
