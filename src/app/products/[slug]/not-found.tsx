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
        <div className="rounded-3xl border border-[#E5DDD0] bg-white p-10 shadow-[0_18px_50px_-15px_rgba(28,25,23,0.08)]">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#B85A2D]">404</p>
          <h1 className="mt-3 font-editorial text-3xl font-black text-[#1C1917]">{dict.productNotFoundTitle}</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#665E57] font-light">{dict.productNotFoundHint}</p>
          <Link
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-[#B85A2D] px-7 py-3 text-sm font-medium text-white shadow-pill transition-all duration-300 hover:bg-[#9E4A22] active:scale-[0.98]"
            href="/products"
          >
            {dict.shopProducts}
          </Link>
        </div>
      </main>
      <StorefrontFooter />
    </>
  );
}
