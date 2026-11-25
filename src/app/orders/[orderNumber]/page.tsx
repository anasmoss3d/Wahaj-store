import { ORDER_STATUS_FLOW } from "@/lib/pricing";
import { StorefrontFooter } from "@/components/storefront/footer";
import { StorefrontHeader } from "@/components/storefront/header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getOrderForViewer } from "@/lib/orders";
import { formatMoney } from "@/lib/money";
import { getDictionary, getLocale, statusLabels } from "@/lib/i18n";
import { formatDateTime } from "@/lib/datetime";
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
  const [order, dict, locale] = await Promise.all([
    getOrderForViewer(orderNumber, query.key),
    getDictionary(),
    getLocale()
  ]);

  return (
    <>
      <StorefrontHeader />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-12 py-10 sm:py-14">
        {!order ? (
          <div className="rounded-3xl border border-[#E5DDD0] bg-white p-10 text-center shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]">
            <h1 className="font-editorial text-2xl sm:text-3xl font-black text-[#1C1917]">{dict.orderNotAvailable}</h1>
            <p className="mt-3 text-sm leading-relaxed text-[#665E57] font-light">{dict.orderNotAvailableHint}</p>
          </div>
        ) : (
          <div className="grid gap-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-[#B85A2D]">{dict.orderTracking}</p>
                <h1 className="mt-1.5 font-editorial text-3xl sm:text-4xl lg:text-5xl font-black text-[#1C1917]">{order.orderNumber}</h1>
              </div>
              <StatusBadge locale={locale} status={order.status} />
            </div>

            <section className="rounded-2xl border border-[#E5DDD0] bg-white p-6 sm:p-7 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]">
              <h2 className="font-editorial text-2xl font-black text-[#1C1917]">{dict.timeline}</h2>
              <ol className="mt-5 grid gap-4">
                {ORDER_STATUS_FLOW.map((status) => {
                  const reached = order.history.some((item) => item.status === status);
                  const current = order.status === status;
                  return (
                    <li className="flex items-start gap-3.5" key={status}>
                      <span
                        className={cn(
                          "mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border",
                          reached || current
                            ? "border-[#B85A2D] bg-[#B85A2D] shadow-[0_0_0_4px_rgba(184,90,45,0.12)]"
                            : "border-[#DED7CB] bg-[#FAF8F5]"
                        )}
                      />
                      <span>
                        <span className="block font-semibold text-[#1C1917]">
                          {statusLabels[locale][status]}
                        </span>
                        <span className="text-xs sm:text-sm text-[#78716C] font-light">
                          {order.history.find((item) => item.status === status)?.createdAt
                            ? formatDateTime(
                                order.history.find((item) => item.status === status)!.createdAt,
                                locale
                              )
                            : dict.waiting}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </section>

            <section className="rounded-2xl border border-[#E5DDD0] bg-white p-6 sm:p-7 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]">
              <h2 className="font-editorial text-2xl font-black text-[#1C1917]">{dict.items}</h2>
              <div className="mt-5 grid gap-4">
                {order.items.map((item) => (
                  <article className="rounded-2xl border border-[#EDE8E0] bg-[#FAF8F5] p-4 sm:p-5" key={item.id}>
                    <div className="flex flex-wrap justify-between gap-3">
                      <div>
                        <span className="font-editorial text-lg font-bold text-[#1C1917] block">{item.productName}</span>
                        <p className="text-sm text-[#78716C] font-light">
                          {item.sku}
                          {item.selectedColorName ? ` · ${item.selectedColorName}` : ""}
                          {` · ${dict.qty} ${item.quantity}`}
                        </p>
                      </div>
                      <p className="font-bold text-[#1C1917]">{formatMoney(item.total, "EGP", locale)}</p>
                    </div>
                    {item.addons.length ? (
                      <ul className="mt-3 grid gap-1 text-sm text-[#665E57]">
                        {item.addons.map((addon) => (
                          <li key={addon.id}>
                            {addon.addonName} +{formatMoney(addon.addonPrice, "EGP", locale)}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                ))}
              </div>
              <dl className="mt-6 grid gap-2.5 border-t border-[#EDE8E0] pt-4 text-sm text-[#57534E]">
                <div className="flex justify-between">
                  <dt>{dict.subtotal}</dt>
                  <dd className="font-medium text-[#1C1917]">{formatMoney(order.subtotal, "EGP", locale)}</dd>
                </div>
                {Number(order.discountTotal) > 0 ? (
                  <div className="flex justify-between text-[#2F463B] font-medium">
                    <dt>
                      {dict.discount}
                      {order.couponCode ? ` (${order.couponCode})` : ""}
                    </dt>
                    <dd>−{formatMoney(order.discountTotal, "EGP", locale)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <dt>{dict.shipping}</dt>
                  <dd>{formatMoney(order.shippingCost, "EGP", locale)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>{dict.paymentMethod}</dt>
                  <dd className="font-semibold text-[#1C1917]">
                    {order.paymentMethod === "INSTAPAY" ? dict.instapayName : dict.cashOnDelivery}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-[#EDE8E0] pt-2.5 text-lg font-bold text-[#1C1917]">
                  <dt>{dict.grandTotal}</dt>
                  <dd className="font-editorial text-[#B85A2D]">{formatMoney(order.grandTotal, "EGP", locale)}</dd>
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
