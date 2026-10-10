import { ORDER_STATUS_FLOW } from "@/lib/pricing";
import { StorefrontFooter } from "@/components/storefront/footer";
import { StorefrontHeader } from "@/components/storefront/header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getOrderForViewer } from "@/lib/orders";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = Promise<{ orderNumber: string }>;
type SearchParams = Promise<{ key?: string }>;

export default async function OrderDetailsPage({
  params,
  searchParams
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const [{ orderNumber }, query] = await Promise.all([params, searchParams]);
  const order = await getOrderForViewer(orderNumber, query.key);

  return (
    <>
      <StorefrontHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        {!order ? (
          <div className="rounded-md border border-concrete-100 bg-white p-8 text-center shadow-soft">
            <h1 className="text-2xl font-bold text-concrete-900">Order not available</h1>
            <p className="mt-3 text-concrete-600">
              Sign in to the matching account or open the secure tracking link from checkout.
            </p>
          </div>
        ) : (
          <div className="grid gap-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-wahaj-gold">
                  Order tracking
                </p>
                <h1 className="mt-2 text-4xl font-bold text-concrete-900">{order.orderNumber}</h1>
              </div>
              <StatusBadge status={order.status} />
            </div>

            <section className="rounded-md border border-concrete-100 bg-white p-5 shadow-soft">
              <h2 className="text-xl font-bold text-concrete-900">Timeline</h2>
              <ol className="mt-5 grid gap-4">
                {ORDER_STATUS_FLOW.map((status) => {
                  const reached = order.history.some((item) => item.status === status);
                  const current = order.status === status;
                  return (
                    <li className="flex items-start gap-3" key={status}>
                      <span
                        className={cn(
                          "mt-1 h-4 w-4 rounded-full border",
                          reached || current ? "border-wahaj-teal bg-wahaj-teal" : "border-concrete-300"
                        )}
                      />
                      <span>
                        <span className="block font-semibold text-concrete-900">{status}</span>
                        <span className="text-sm text-concrete-500">
                          {order.history.find((item) => item.status === status)?.createdAt.toLocaleString("en-EG") ||
                            "Waiting"}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </section>

            <section className="rounded-md border border-concrete-100 bg-white p-5 shadow-soft">
              <h2 className="text-xl font-bold text-concrete-900">Items</h2>
              <div className="mt-5 grid gap-4">
                {order.items.map((item) => (
                  <article className="rounded-md bg-concrete-50 p-4" key={item.id}>
                    <div className="flex flex-wrap justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-concrete-900">{item.productName}</h3>
                        <p className="text-sm text-concrete-500">
                          {item.sku} · {item.selectedColorName} · Qty {item.quantity}
                        </p>
                      </div>
                      <p className="font-bold text-concrete-900">{formatMoney(item.total)}</p>
                    </div>
                    {item.addons.length ? (
                      <ul className="mt-3 grid gap-1 text-sm text-concrete-600">
                        {item.addons.map((addon) => (
                          <li key={addon.id}>
                            {addon.addonName} +{formatMoney(addon.addonPrice)}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                ))}
              </div>
              <dl className="mt-5 grid gap-2 border-t border-concrete-100 pt-4 text-sm">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd>{formatMoney(order.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Shipping</dt>
                  <dd>{formatMoney(order.shippingCost)}</dd>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <dt>Total</dt>
                  <dd>{formatMoney(order.grandTotal)}</dd>
                </div>
              </dl>
            </section>
          </div>
        )}
      </main>
      <StorefrontFooter />
    </>
  );
}
