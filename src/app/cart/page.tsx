import Image from "next/image";
import { StorefrontFooter } from "@/components/storefront/footer";
import { StorefrontHeader } from "@/components/storefront/header";
import { CartLineControls } from "@/components/storefront/cart-line-controls";
import { ButtonLink } from "@/components/ui/button";
import { getCartView } from "@/lib/cart";
import { formatMoney } from "@/lib/money";
import { getStoreSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const [cart, settings] = await Promise.all([getCartView(), getStoreSettings()]);
  const grandTotal = cart.subtotalCents / 100 + settings.shippingFlatRate;

  return (
    <>
      <StorefrontHeader />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="text-4xl font-bold text-concrete-900">Cart</h1>
        {cart.items.length === 0 ? (
          <div className="mt-8 rounded-md border border-concrete-100 bg-white p-8 text-center shadow-soft">
            <p className="text-concrete-600">Your cart is empty.</p>
            <ButtonLink className="mt-5" href="/products">
              Browse products
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
                    <CartLineControls itemId={item.id} quantity={item.quantity} />
                  </div>
                </article>
              ))}
            </section>
            <aside className="h-fit rounded-md border border-concrete-100 bg-white p-5 shadow-soft">
              <h2 className="text-xl font-bold text-concrete-900">Order summary</h2>
              <dl className="mt-5 grid gap-3 text-sm">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd>{formatMoney(cart.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Shipping</dt>
                  <dd>{formatMoney(String(settings.shippingFlatRate))}</dd>
                </div>
                <div className="flex justify-between border-t border-concrete-100 pt-3 text-lg font-bold">
                  <dt>Total</dt>
                  <dd>{formatMoney(String(grandTotal))}</dd>
                </div>
              </dl>
              <ButtonLink className="mt-6 w-full" href="/checkout">
                Checkout
              </ButtonLink>
            </aside>
          </div>
        )}
      </main>
      <StorefrontFooter />
    </>
  );
}
