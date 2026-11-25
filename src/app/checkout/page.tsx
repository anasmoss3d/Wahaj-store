import Image from "next/image";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/storefront/checkout-form";
import { CouponForm } from "@/components/storefront/coupon-form";
import { StorefrontFooter } from "@/components/storefront/footer";
import { StorefrontHeader } from "@/components/storefront/header";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCurrentUser } from "@/lib/auth";
import { getCartView } from "@/lib/cart";
import { GOVERNORATES } from "@/lib/governorates";
import { getDictionary, getLocale } from "@/lib/i18n";
import { formatMoney, toCents } from "@/lib/money";
import { getStoreSettings } from "@/lib/settings";
import { getActiveShippingRates } from "@/lib/shipping";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [cart, settings, rates, dict, user, locale] = await Promise.all([
    getCartView(),
    getStoreSettings(),
    getActiveShippingRates(),
    getDictionary(),
    getCurrentUser(),
    getLocale()
  ]);

  if (!user && cart.items.length > 0) {
    redirect("/auth/login?next=%2Fcheckout");
  }

  return (
    <>
      <StorefrontHeader />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-12 py-10 sm:py-14">
        <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-black text-[#1C1917]">{dict.checkout}</h1>
        {cart.items.length === 0 ? (
          <Card className="mt-8 rounded-3xl border-[#E5DDD0] p-10 text-center">
            <CardContent className="flex flex-col items-center justify-center p-0">
              <p className="text-base text-[#665E57] font-light">{dict.yourCartEmpty}</p>
              <ButtonLink className="mt-6" href="/products">
                {dict.browseProducts}
              </ButtonLink>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_410px]">
            <div className="grid content-start gap-6">
              <CheckoutForm
                defaults={
                  user
                    ? { name: user.name, phone: user.phone, email: user.email ?? "" }
                    : undefined
                }
                discountCents={cart.discountCents}
                flatRate={settings.shippingFlatRate}
                governorates={[...GOVERNORATES]}
                hasCustomColor={cart.items.some((item) => item.colorIsCustom)}
                instapay={{ handle: settings.instapayHandle, qrImage: settings.instapayQrImage, link: settings.instapayLink }}
                labels={dict}
                locale={locale}
                rates={rates.map((row) => ({
                  governorate: row.governorate,
                  rate: Number(row.rate)
                }))}
                subtotalCents={cart.subtotalCents}
                thresholdCents={toCents(String(settings.freeShippingThreshold))}
              />
            </div>
            <aside className="h-fit">
              <Card className="rounded-3xl border-[#E5DDD0] bg-[#FAF8F5]">
                <CardHeader className="pb-3">
                  <CardTitle className="font-editorial text-xl font-bold text-[#1C1917]">{dict.reviewOrder}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-3.5">
                    {cart.items.map((item) => (
                      <div className="grid grid-cols-[64px_1fr] gap-3.5 items-center" key={item.id}>
                        <div className="relative aspect-square overflow-hidden rounded-xl bg-[#EDE7DD]">
                          <Image alt={item.productName} className="object-cover" fill src={item.image} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-editorial text-sm font-bold text-[#1C1917] line-clamp-1">{item.productName}</p>
                          <p className="text-xs text-[#78716C] font-light">
                            {item.colorName ? `${item.colorName} · ` : ""}
                            {item.sizeName ? `${item.sizeName} · ` : ""}
                            {dict.quantity} {item.quantity}
                          </p>
                          <p className="text-xs font-bold text-[#B85A2D] mt-0.5">{formatMoney(item.total, "EGP", locale)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <CouponForm
                    couponCode={cart.couponCode}
                    discountCents={cart.discountCents}
                    labels={{
                      apply: dict.apply,
                      remove: dict.remove,
                      placeholder: dict.couponPlaceholder,
                      saving: dict.saving
                    }}
                    locale={locale}
                  />

                  <Separator />

                  <dl className="grid gap-2.5 text-sm">
                    <div className="flex justify-between text-[#57534E]">
                      <dt>{dict.subtotal}</dt>
                      <dd className="font-semibold text-[#1C1917]">{formatMoney(cart.subtotal, "EGP", locale)}</dd>
                    </div>
                    {cart.discountCents > 0 ? (
                      <div className="flex justify-between font-medium text-[#2F463B]">
                        <dt>
                          {dict.discount} ({cart.couponCode})
                        </dt>
                        <dd>−{formatMoney(String(cart.discountCents / 100), "EGP", locale)}</dd>
                      </div>
                    ) : null}
                    <div className="flex justify-between text-[#57534E]">
                      <dt>{dict.shipping}</dt>
                      <dd className="text-[#8C827A] font-light">{dict.shippingAtCheckout}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </aside>
          </div>
        )}
      </main>
      <StorefrontFooter />
    </>
  );
}
