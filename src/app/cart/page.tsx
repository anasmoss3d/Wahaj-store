import Image from "next/image";
import { StorefrontFooter } from "@/components/storefront/footer";
import { StorefrontHeader } from "@/components/storefront/header";
import { CartLineControls } from "@/components/storefront/cart-line-controls";
import { CouponForm } from "@/components/storefront/coupon-form";
import { ButtonLink } from "@/components/ui/button";
import { getCartView } from "@/lib/cart";
import { formatMoney } from "@/lib/money";
import { getDictionary } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const [cart, dict] = await Promise.all([getCartView(), getDictionary()]);
  const total = cart.subtotalCents - cart.discountCents;

  return (
    <>
      <StorefrontHeader />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="text-4xl font-bold text-concrete-900">{dict.cart}</h1>
        {cart.items.length === 0 ? (
          <div className="mt-8 rounded-md border border-concrete-100 bg-white p-8 text-center shadow-soft">
            <p className="text-concrete-600">{dict.yourCartEmpty}</p>
            <ButtonLink className="mt-5" href="/products">
              {dict.browseProducts}
            </ButtonLink>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            <section className="grid gap-4">
              {cart.items.map((item) => (
                <article
                  className="grid gap-4 rounded-md border border-concrete-100 bg-white p-4 shadow-soft md:grid-cols-[140px_1fr_auto]"
                  key={item.id}
                >
                  <div className="relative aspect-square overflow-hidden rounded-md bg-concrete-100">
                    <Image alt={item.productName} className="object-cover" fill src={item.image} />
                  </div>
                  <div>
                    <a className="text-xl font-bold text-concrete-900" href={`/products/${item.slug}`}>
                      {item.productName}
                    </a>
                    <p className="mt-1 text-sm text-concrete-500">SKU {item.sku}</p>
                    <p className="mt-3 inline-flex items-center gap-2 text-sm">
                      <span
                        className="h-4 w-4 rounded-full border"
                        style={{ background: item.colorHex }}
                      />
                      {item.colorName}
                    </p>
                    {item.addons.length ? (
                      <ul className="mt-3 grid gap-1 text-sm text-concrete-600">
                        {item.addons.map((addon) => (
                          <li key={addon.id}>
                            {addon.name} +{formatMoney(addon.price)}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <div className="grid content-between gap-4 justify-self-start md:justify-self-end">
                    <p className="text-end text-lg font-bold text-concrete-900">
                      {formatMoney(item.total)}
                    </p>
                    <CartLineControls
                      itemId={item.id}
                      labels={{ decrease: dict.decreaseQty, increase: dict.increaseQty, remove: dict.remove }}
                      quantity={item.quantity}
                    />
                  </div>
                </article>
              ))}
            </section>
            <aside className="grid h-fit gap-4 rounded-md border border-concrete-100 bg-white p-5 shadow-soft">
              <h2 className="text-xl font-bold text-concrete-900">{dict.orderSummary}</h2>
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
              <dl className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <dt>{dict.subtotal}</dt>
                  <dd>{formatMoney(cart.subtotal)}</dd>
                </div>
                {cart.discountCents > 0 ? (
                  <div className="flex justify-between text-emerald-700">
                    <dt>{dict.discount}</dt>
                    <dd>−{formatMoney(String(cart.discountCents / 100))}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <dt>{dict.shipping}</dt>
                  <dd>{dict.shippingAtCheckout}</dd>
                </div>
                <div className="flex justify-between border-t border-concrete-100 pt-3 text-lg font-bold">
                  <dt>{dict.total}</dt>
                  <dd>{formatMoney(String(total / 100))}</dd>
                </div>
              </dl>
              <ButtonLink className="w-full" href="/checkout">
                {dict.checkout}
              </ButtonLink>
            </aside>
          </div>
        )}
      </main>
      <StorefrontFooter />
    </>
  );
}
