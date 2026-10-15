import Image from "next/image";
import { CheckoutForm } from "@/components/storefront/checkout-form";
import { CouponForm } from "@/components/storefront/coupon-form";
import { StorefrontFooter } from "@/components/storefront/footer";
import { StorefrontHeader } from "@/components/storefront/header";
import { ButtonLink } from "@/components/ui/button";
import { getCartView } from "@/lib/cart";
import { GOVERNORATES } from "@/lib/governorates";
import { getDictionary } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { toCents } from "@/lib/money";
import { getStoreSettings } from "@/lib/settings";
import { getActiveShippingRates } from "@/lib/shipping";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [cart, settings, rates, dict] = await Promise.all([
    getCartView(),
    getStoreSettings(),
    getActiveShippingRates(),
    getDictionary()
  ]);

  return (
    <>
      <StorefrontHeader />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="text-4xl font-bold text-concrete-900">{dict.checkout}</h1>
        {cart.items.length === 0 ? (
          <div className="mt-8 rounded-md border border-concrete-100 bg-white p-8 text-center shadow-soft">
            <p className="text-concrete-600">{dict.yourCartEmpty}</p>
            <ButtonLink className="mt-5" href="/products">
              {dict.browseProducts}
            </ButtonLink>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_420px]">
            <div className="grid content-start gap-6">
              <CheckoutForm
                discountCents={cart.discountCents}
                flatRate={settings.shippingFlatRate}
                governorates={[...GOVERNORATES]}
                instapay={{ handle: settings.instapayHandle, qrImage: settings.instapayQrImage, link: settings.instapayLink }}
                labels={dict}
                rates={rates.map((row) => ({
                  governorate: row.governorate,
                  rate: Number(row.rate)
                }))}
                subtotalCents={cart.subtotalCents}
                thresholdCents={toCents(String(settings.freeShippingThreshold))}
              />
            </div>
            <aside className="grid h-fit content-start gap-4 rounded-md border border-concrete-100 bg-white p-5 shadow-soft">
              <h2 className="text-xl font-bold text-concrete-900">{dict.reviewOrder}</h2>
              <div className="grid gap-4">
                {cart.items.map((item) => (
                  <div className="grid grid-cols-[72px_1fr] gap-3" key={item.id}>
                    <div className="relative aspect-square overflow-hidden rounded-md bg-concrete-100">
                      <Image alt={item.productName} className="object-cover" fill src={item.image} />
                    </div>
                    <div>
                      <p className="font-semibold text-concrete-900">{item.productName}</p>
                      <p className="text-sm text-concrete-500">
                        {item.colorName} · {dict.quantity} {item.quantity}
                      </p>
                      <p className="text-sm font-semibold text-wahaj-teal">{formatMoney(item.total)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <CouponForm
                couponCode={cart.couponCode}
                discountCents={cart.discountCents}
                labels={{
                  apply: dict.apply,
                  remove: dict.remove,
                  placeholder: dict.couponPlaceholder,
                  saving: dict.saving
                }}
              />
              <dl className="grid gap-3 border-t border-concrete-100 pt-5 text-sm">
                <div className="flex justify-between">
                  <dt>{dict.subtotal}</dt>
                  <dd>{formatMoney(cart.subtotal)}</dd>
                </div>
                {cart.discountCents > 0 ? (
                  <div className="flex justify-between text-emerald-700">
                    <dt>
                      {dict.discount} ({cart.couponCode})
                    </dt>
                    <dd>−{formatMoney(String(cart.discountCents / 100))}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <dt>{dict.shipping}</dt>
                  <dd>{dict.shippingAtCheckout}</dd>
                </div>
              </dl>
            </aside>
          </div>
        )}
      </main>
      <StorefrontFooter />
    </>
  );
}
