import Image from "next/image";
import { CheckoutForm } from "@/components/storefront/checkout-form";
import { StorefrontFooter } from "@/components/storefront/footer";
import { StorefrontHeader } from "@/components/storefront/header";
import { ButtonLink } from "@/components/ui/button";
import { getCartView } from "@/lib/cart";
import { formatMoney } from "@/lib/money";
import { getStoreSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [cart, settings] = await Promise.all([getCartView(), getStoreSettings()]);
  const total = cart.subtotalCents / 100 + settings.shippingFlatRate;

  return (
    <>
      <StorefrontHeader />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="text-4xl font-bold text-concrete-900">Checkout</h1>
        {cart.items.length === 0 ? (
          <div className="mt-8 rounded-md border border-concrete-100 bg-white p-8 text-center shadow-soft">
            <p className="text-concrete-600">Add products before checkout.</p>
            <ButtonLink className="mt-5" href="/products">
              Browse products
            </ButtonLink>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_420px]">
            <CheckoutForm />
            <aside className="h-fit rounded-md border border-concrete-100 bg-white p-5 shadow-soft">
              <h2 className="text-xl font-bold text-concrete-900">Review order</h2>
              <div className="mt-5 grid gap-4">
                {cart.items.map((item) => (
                  <div className="grid grid-cols-[72px_1fr] gap-3" key={item.id}>
                    <div className="relative aspect-square overflow-hidden rounded-md bg-concrete-100">
                      <Image alt={item.productName} className="object-cover" fill src={item.image} />
                    </div>
                    <div>
                      <p className="font-semibold text-concrete-900">{item.productName}</p>
                      <p className="text-sm text-concrete-500">
                        {item.colorName} · Qty {item.quantity}
                      </p>
                      <p className="text-sm font-semibold text-wahaj-teal">{formatMoney(item.total)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <dl className="mt-5 grid gap-3 border-t border-concrete-100 pt-5 text-sm">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd>{formatMoney(cart.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Shipping</dt>
                  <dd>{formatMoney(String(settings.shippingFlatRate))}</dd>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <dt>Grand total</dt>
                  <dd>{formatMoney(String(total))}</dd>
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
