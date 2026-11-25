import Image from "next/image";
import { StorefrontFooter } from "@/components/storefront/footer";
import { StorefrontHeader } from "@/components/storefront/header";
import { CartLineControls } from "@/components/storefront/cart-line-controls";
import { CouponForm } from "@/components/storefront/coupon-form";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { getCartView } from "@/lib/cart";
import { formatMoney } from "@/lib/money";
import { getDictionary, getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const [cart, dict, locale] = await Promise.all([getCartView(), getDictionary(), getLocale()]);
  const total = cart.subtotalCents - cart.discountCents;

  return (
    <>
      <StorefrontHeader />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 py-10 sm:py-14">
        <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-black text-[#1C1917]">{dict.cart}</h1>
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
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
            <section className="grid gap-4 content-start">
              {cart.items.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden border-[#E5DDD0] transition-shadow duration-300 hover:shadow-[0_18px_42px_-16px_rgba(28,25,23,0.12)]"
                >
                  <CardContent className="grid gap-4 p-4 sm:p-5 md:grid-cols-[130px_1fr_auto]">
                    <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-xl bg-[#EDE7DD] sm:w-full">
                      <Image alt={item.productName} className="object-cover" fill src={item.image} />
                    </div>
                    <div>
                      <a className="font-editorial text-base font-bold text-[#1C1917] transition-colors hover:text-[#B85A2D] sm:text-xl" href={`/products/${item.slug}`}>
                        {item.productName}
                      </a>
                      <p className="mt-1 text-xs text-[#8C827A] font-light">SKU {item.sku}</p>
                      {item.colorName ? (
                        <div className="mt-2.5 flex items-center gap-2">
                          <span
                            className="h-3.5 w-3.5 rounded-full border border-[#DED7CB]"
                            style={{ background: item.colorHex ?? "transparent" }}
                          />
                          <span className="text-xs font-medium text-[#57534E]">{item.colorName}</span>
                        </div>
                      ) : null}
                      {item.sizeName ? (
                        <p className="mt-1 text-xs font-medium text-[#665E57]">
                          {locale === "ar" ? "المقاس:" : "Size:"} {item.sizeName}
                        </p>
                      ) : null}
                      {item.addons.length ? (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {item.addons.map((addon) => (
                            <Badge key={addon.id} variant="secondary" className="text-[11px] font-medium">
                              {addon.name} (+{formatMoney(addon.price, "EGP", locale)})
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-row items-center justify-between gap-4 border-t border-[#EDE8E0] pt-3 md:flex-col md:items-end md:justify-between md:border-t-0 md:pt-0">
                      <p className="font-editorial text-lg font-bold text-[#B85A2D]">
                        {formatMoney(item.total, "EGP", locale)}
                      </p>
                      <CartLineControls
                        itemId={item.id}
                        labels={{ decrease: dict.decreaseQty, increase: dict.increaseQty, remove: dict.remove }}
                        quantity={item.quantity}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </section>
            <aside className="h-fit">
              <Card className="rounded-3xl border-[#E5DDD0] bg-[#FAF8F5]">
                <CardHeader className="pb-4">
                  <CardTitle className="font-editorial text-xl font-bold text-[#1C1917]">{dict.orderSummary}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
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
                  <dl className="grid gap-3 text-sm">
                    <div className="flex justify-between text-[#57534E]">
                      <dt>{dict.subtotal}</dt>
                      <dd className="font-semibold text-[#1C1917]">{formatMoney(cart.subtotal, "EGP", locale)}</dd>
                    </div>
                    {cart.discountCents > 0 ? (
                      <div className="flex justify-between font-medium text-[#2F463B]">
                        <dt>{dict.discount}</dt>
                        <dd>−{formatMoney(String(cart.discountCents / 100), "EGP", locale)}</dd>
                      </div>
                    ) : null}
                    <div className="flex justify-between text-[#57534E]">
                      <dt>{dict.shipping}</dt>
                      <dd className="text-[#8C827A] font-light">{dict.shippingAtCheckout}</dd>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold text-[#1C1917]">
                      <dt>{dict.total}</dt>
                      <dd className="font-editorial text-[#B85A2D]">{formatMoney(String(total / 100), "EGP", locale)}</dd>
                    </div>
                  </dl>
                  <ButtonLink className="w-full" href="/checkout">
                    {dict.checkout}
                  </ButtonLink>
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
