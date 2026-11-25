import Image from "next/image";
import { OrderStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import {
  deleteOrderAction,
  updateOrderCustomerAction,
  updateOrderItemAction,
  updateOrderStatusAction
} from "@/app/actions/admin";
import { ActionForm } from "@/components/admin/action-form";
import { AdminShell } from "@/components/admin/admin-shell";
import { DeleteButton } from "@/components/admin/delete-button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/datetime";
import { GOVERNORATES, governorateLabel } from "@/lib/governorates";
import { getAdminDictionary, getLocale, statusLabels, type OrderStatusKey } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { PERMISSIONS } from "@/lib/rbac";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function AdminOrderDetailsPage({ params }: { params: Params }) {
  await requireAdmin(PERMISSIONS.ORDERS_MANAGE);
  const [{ id }, locale, dict] = await Promise.all([
    params,
    getLocale(),
    getAdminDictionary()
  ]);
  const isArabic = locale === "ar";
  const d = dict.orderDetail;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { addons: true } },
      history: {
        include: { adminUser: true },
        orderBy: { createdAt: "asc" }
      }
    }
  });
  if (!order) notFound();
  const editable = order.status !== "DELIVERED";

  return (
    <AdminShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p
            className={cn(
              "text-[11px] text-[#8C7A6B] font-medium mb-1",
              !isArabic && "uppercase tracking-[0.2em]"
            )}
          >
            {d.kicker}
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-black text-[#1C1917]" dir="ltr">
            {order.orderNumber}
          </h1>
          <p className="mt-2 text-sm text-[#665E57] font-light">
            {order.customerName} · <span dir="ltr">{order.phone}</span> ·{" "}
            {formatDateTime(order.createdAt, locale)}
          </p>
        </div>
        <div className="grid gap-2.5 justify-items-end">
          <StatusBadge locale={locale} status={order.status} />
          <DeleteButton action={deleteOrderAction} id={order.id} label={d.deleteOrder} />
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="grid content-start gap-5">
          <div className="rounded-2xl border border-[#E5DDD0] bg-white p-5 sm:p-6 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]">
            <h2 className="font-editorial text-2xl font-black text-[#1C1917]">{d.payment}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[#1C1917]">
              <span className="font-semibold">
                {order.paymentMethod === "INSTAPAY" ? d.instapayPrepaid : d.cashOnDelivery}
              </span>
              {order.paymentReceiptUrl ? (
                <a href={order.paymentReceiptUrl} target="_blank" rel="noreferrer">
                  <Image
                    alt={d.receiptAlt}
                    className="h-32 w-32 rounded-2xl border border-[#E5DDD0] bg-[#EDE7DD] object-cover transition hover:border-[#B85A2D]"
                    height={128}
                    src={order.paymentReceiptUrl}
                    width={128}
                  />
                </a>
              ) : (
                <span className="text-[#78716C] font-light">{d.noReceipt}</span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5DDD0] bg-white p-5 sm:p-6 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]">
            <h2 className="font-editorial text-2xl font-black text-[#1C1917]">
              {d.itemsAndCustomization}
            </h2>
            <div className="mt-5 grid gap-4">
              {order.items.map((item) => (
                <article
                  className="rounded-2xl border border-[#EDE8E0] bg-[#FAF8F5] p-4 sm:p-5"
                  key={item.id}
                >
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <span className="font-editorial text-lg font-bold text-[#1C1917] block">
                        {item.productName}
                      </span>
                      <p className="text-sm text-[#78716C] font-light">
                        <span dir="ltr">{item.sku}</span>
                        {item.selectedColorName ? ` · ${item.selectedColorName}` : ""}
                        {item.selectedSizeName ? ` · ${item.selectedSizeName}` : ""}
                        {` · ${d.qty} ${item.quantity}`}
                      </p>
                      <p className="mt-1 text-xs text-[#8C827A]">
                        {item.selectedSizeName
                          ? `${d.size} ${item.selectedSizeName}`
                          : `${d.base} ${formatMoney(item.basePrice, "EGP", locale)}`}
                        {item.selectedColorName
                          ? ` · ${d.color} +${formatMoney(item.colorAdditionalPrice, "EGP", locale)}`
                          : ""}
                      </p>
                    </div>
                    <p className="font-bold text-[#1C1917]">
                      {formatMoney(item.total, "EGP", locale)}
                    </p>
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
                  {editable ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2.5">
                      <ActionForm action={updateOrderItemAction} submitLabel={d.setQty}>
                        <input name="id" type="hidden" value={order.id} />
                        <input name="itemId" type="hidden" value={item.id} />
                        <input
                          className="min-h-10 w-24 rounded-xl border border-[#DED7CB] bg-white px-3 text-sm text-[#1C1917] outline-none focus:border-[#B85A2D] focus:ring-2 focus:ring-[#B85A2D]/20"
                          defaultValue={item.quantity}
                          dir="ltr"
                          min={0}
                          max={99}
                          name="quantity"
                          type="number"
                        />
                      </ActionForm>
                      <span className="text-xs text-[#8C827A]">{d.zeroRemovesItem}</span>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5DDD0] bg-white p-5 sm:p-6 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]">
            <h2 className="font-editorial text-2xl font-black text-[#1C1917]">
              {d.statusHistory}
            </h2>
            <ol className="mt-5 grid gap-3">
              {order.history.map((event) => (
                <li
                  className="rounded-2xl border border-[#EDE8E0] bg-[#FAF8F5] p-3.5"
                  key={event.id}
                >
                  <p className="font-semibold text-[#1C1917]">
                    {statusLabels[locale][event.status as OrderStatusKey] ?? event.status}
                  </p>
                  <p className="text-sm text-[#78716C] font-light">
                    {formatDateTime(event.createdAt, locale)}
                    {event.adminUser ? ` · ${event.adminUser.name}` : ""}
                  </p>
                  {event.note ? <p className="mt-2 text-sm text-[#665E57]">{event.note}</p> : null}
                </li>
              ))}
            </ol>
          </div>

          {editable ? (
            <div className="rounded-2xl border border-[#E5DDD0] bg-white p-5 sm:p-6 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]">
              <h2 className="font-editorial text-2xl font-black text-[#1C1917]">
                {d.editCustomerDetails}
              </h2>
              <div className="mt-4">
                <ActionForm
                  action={updateOrderCustomerAction}
                  submitLabel={dict.common.saveChanges}
                >
                  <input name="id" type="hidden" value={order.id} />
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label={d.customerName}>
                      <Input defaultValue={order.customerName} name="customerName" required />
                    </Field>
                    <Field label={d.phone}>
                      <Input defaultValue={order.phone} dir="ltr" name="phone" required />
                    </Field>
                    <Field label={d.whatsapp}>
                      <Input defaultValue={order.whatsapp ?? ""} dir="ltr" name="whatsapp" />
                    </Field>
                    <Field label={d.email}>
                      <Input defaultValue={order.email ?? ""} dir="ltr" name="email" />
                    </Field>
                    <Field label={d.governorate}>
                      <select
                        className="min-h-11 w-full min-w-0 rounded-xl border border-[#DED7CB] bg-white px-4 text-sm text-[#1C1917] outline-none focus:border-[#B85A2D] focus:ring-2 focus:ring-[#B85A2D]/20"
                        defaultValue={order.governorate}
                        name="governorate"
                      >
                        {GOVERNORATES.map((gov) => (
                          <option key={gov} value={gov}>
                            {governorateLabel(gov, locale)}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label={d.city}>
                      <Input defaultValue={order.city} name="city" required />
                    </Field>
                  </div>
                  <Field label={d.fullAddress}>
                    <Textarea defaultValue={order.fullAddress} name="fullAddress" required />
                  </Field>
                  <Field label={d.building}>
                    <Input defaultValue={order.building ?? ""} name="building" />
                  </Field>
                  <Field label={d.customerNotes}>
                    <Textarea defaultValue={order.notes ?? ""} name="notes" />
                  </Field>
                  <Field label={d.internalNotes}>
                    <Textarea defaultValue={order.internalNotes ?? ""} name="internalNotes" />
                  </Field>
                </ActionForm>
              </div>
            </div>
          ) : null}
        </section>

        <aside className="grid h-fit gap-5">
          <div className="rounded-2xl border border-[#E5DDD0] bg-white p-5 sm:p-6 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]">
            <h2 className="font-editorial text-2xl font-black text-[#1C1917]">{d.customer}</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div>
                <dt className="text-[#78716C]">{d.address}</dt>
                <dd className="font-semibold text-[#1C1917]">
                  {order.fullAddress}, {order.city}, {governorateLabel(order.governorate, locale)}
                </dd>
              </div>
              <div>
                <dt className="text-[#78716C]">{d.whatsapp}</dt>
                <dd className="text-[#1C1917]" dir={order.whatsapp ? "ltr" : undefined}>
                  {order.whatsapp || d.notProvided}
                </dd>
              </div>
              <div>
                <dt className="text-[#78716C]">{d.notes}</dt>
                <dd className="text-[#665E57]">{order.notes || d.noNotes}</dd>
              </div>
              {order.internalNotes ? (
                <div>
                  <dt className="text-[#78716C]">{d.internalNotes}</dt>
                  <dd className="text-[#665E57]">{order.internalNotes}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div className="rounded-2xl border border-[#E5DDD0] bg-[#FAF8F5] p-5 sm:p-6 shadow-sm">
            <h2 className="font-editorial text-2xl font-black text-[#1C1917]">{d.totals}</h2>
            <dl className="mt-4 grid gap-2.5 text-sm text-[#1C1917]">
              <div className="flex justify-between">
                <dt className="text-[#665E57]">{d.subtotal}</dt>
                <dd>{formatMoney(order.subtotal, "EGP", locale)}</dd>
              </div>
              {Number(order.discountTotal) > 0 ? (
                <div className="flex justify-between text-[#2F463B]">
                  <dt>
                    {d.discount}
                    {order.couponCode ? ` (${order.couponCode})` : ""}
                  </dt>
                  <dd>−{formatMoney(order.discountTotal, "EGP", locale)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-[#665E57]">{d.shipping}</dt>
                <dd>{formatMoney(order.shippingCost, "EGP", locale)}</dd>
              </div>
              <div className="flex justify-between border-t border-[#E5DDD0] pt-2.5 text-lg font-bold text-[#1C1917]">
                <dt>{d.total}</dt>
                <dd>{formatMoney(order.grandTotal, "EGP", locale)}</dd>
              </div>
            </dl>
          </div>

          <ActionForm action={updateOrderStatusAction} submitLabel={d.updateStatus}>
            <input name="orderId" type="hidden" value={order.id} />
            <label className="grid gap-2 text-sm font-medium text-[#1C1917]">
              <span>{d.status}</span>
              <select
                className="min-h-11 w-full min-w-0 rounded-xl border border-[#DED7CB] bg-white px-4 text-sm text-[#1C1917] outline-none focus:border-[#B85A2D] focus:ring-2 focus:ring-[#B85A2D]/20"
                defaultValue={order.status}
                name="status"
              >
                {Object.values(OrderStatus).map((item) => (
                  <option key={item} value={item}>
                    {statusLabels[locale][item as OrderStatusKey] ?? item}
                  </option>
                ))}
              </select>
            </label>
            <Field label={d.internalNote}>
              <Textarea name="note" />
            </Field>
          </ActionForm>
        </aside>
      </div>
    </AdminShell>
  );
}
