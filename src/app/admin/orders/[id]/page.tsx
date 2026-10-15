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
import { GOVERNORATES } from "@/lib/governorates";
import { formatMoney } from "@/lib/money";
import { PERMISSIONS } from "@/lib/rbac";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function AdminOrderDetailsPage({ params }: { params: Params }) {
  await requireAdmin(PERMISSIONS.ORDERS_MANAGE);
  const { id } = await params;
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
          <h1 className="text-3xl font-bold text-concrete-900">{order.orderNumber}</h1>
          <p className="mt-2 text-concrete-600">
            {order.customerName} · <span dir="ltr">{order.phone}</span> ·{" "}
            {formatDateTime(order.createdAt, "en")}
          </p>
        </div>
        <div className="grid gap-2 justify-items-end">
          <StatusBadge status={order.status} />
          <DeleteButton action={deleteOrderAction} id={order.id} label="Delete order" />
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="grid content-start gap-5">
          <div className="rounded-md border border-concrete-100 bg-white p-5 shadow-soft">
            <h2 className="text-xl font-bold text-concrete-900">Payment</h2>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
              <span className="font-semibold">
                {order.paymentMethod === "INSTAPAY" ? "InstaPay (prepaid)" : "Cash on Delivery"}
              </span>
              {order.paymentReceiptUrl ? (
                <a href={order.paymentReceiptUrl} target="_blank" rel="noreferrer">
                  <Image
                    alt="Payment receipt"
                    className="h-32 w-32 rounded-md border border-concrete-200 object-cover"
                    height={128}
                    src={order.paymentReceiptUrl}
                    width={128}
                  />
                </a>
              ) : (
                <span className="text-concrete-500">No receipt uploaded</span>
              )}
            </div>
          </div>

          <div className="rounded-md border border-concrete-100 bg-white p-5 shadow-soft">
            <h2 className="text-xl font-bold text-concrete-900">Items and customization</h2>
            <div className="mt-5 grid gap-4">
              {order.items.map((item) => (
                <article className="rounded-md bg-concrete-50 p-4" key={item.id}>
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-concrete-900">{item.productName}</h3>
                      <p className="text-sm text-concrete-500">
                        {item.sku} · {item.selectedColorName} · Qty {item.quantity}
                      </p>
                      <p className="mt-1 text-xs text-concrete-500">
                        Base {formatMoney(item.basePrice)} · Color +{formatMoney(item.colorAdditionalPrice)}
                      </p>
                    </div>
                    <p className="font-bold">{formatMoney(item.total)}</p>
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
                  {editable ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <ActionForm action={updateOrderItemAction} submitLabel="Set qty">
                        <input name="id" type="hidden" value={order.id} />
                        <input name="itemId" type="hidden" value={item.id} />
                        <input
                          className="min-h-10 w-24 rounded-md border border-concrete-200 px-2"
                          defaultValue={item.quantity}
                          min={0}
                          max={99}
                          name="quantity"
                          type="number"
                        />
                      </ActionForm>
                      <span className="text-xs text-concrete-500">0 removes the item</span>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-concrete-100 bg-white p-5 shadow-soft">
            <h2 className="text-xl font-bold text-concrete-900">Status history</h2>
            <ol className="mt-5 grid gap-3">
              {order.history.map((event) => (
                <li className="rounded-md bg-concrete-50 p-3" key={event.id}>
                  <p className="font-semibold">{event.status}</p>
                  <p className="text-sm text-concrete-500">
                    {formatDateTime(event.createdAt, "en")}
                    {event.adminUser ? ` · ${event.adminUser.name}` : ""}
                  </p>
                  {event.note ? <p className="mt-2 text-sm text-concrete-600">{event.note}</p> : null}
                </li>
              ))}
            </ol>
          </div>

          {editable ? (
            <div className="rounded-md border border-concrete-100 bg-white p-5 shadow-soft">
              <h2 className="text-xl font-bold text-concrete-900">Edit customer details</h2>
              <div className="mt-4">
                <ActionForm action={updateOrderCustomerAction} submitLabel="Save changes">
                  <input name="id" type="hidden" value={order.id} />
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Customer name">
                      <Input defaultValue={order.customerName} name="customerName" required />
                    </Field>
                    <Field label="Phone">
                      <Input defaultValue={order.phone} name="phone" required />
                    </Field>
                    <Field label="WhatsApp">
                      <Input defaultValue={order.whatsapp ?? ""} name="whatsapp" />
                    </Field>
                    <Field label="Email">
                      <Input defaultValue={order.email ?? ""} name="email" />
                    </Field>
                    <Field label="Governorate">
                      <select
                        className="min-h-11 w-full rounded-md border border-concrete-200 bg-white px-3"
                        defaultValue={order.governorate}
                        name="governorate"
                      >
                        {GOVERNORATES.map((gov) => (
                          <option key={gov} value={gov}>
                            {gov}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="City">
                      <Input defaultValue={order.city} name="city" required />
                    </Field>
                  </div>
                  <Field label="Full address">
                    <Textarea defaultValue={order.fullAddress} name="fullAddress" required />
                  </Field>
                  <Field label="Building">
                    <Input defaultValue={order.building ?? ""} name="building" />
                  </Field>
                  <Field label="Customer notes">
                    <Textarea defaultValue={order.notes ?? ""} name="notes" />
                  </Field>
                  <Field label="Internal notes">
                    <Textarea defaultValue={order.internalNotes ?? ""} name="internalNotes" />
                  </Field>
                </ActionForm>
              </div>
            </div>
          ) : null}
        </section>

        <aside className="grid h-fit gap-5">
          <div className="rounded-md border border-concrete-100 bg-white p-5 shadow-soft">
            <h2 className="text-xl font-bold text-concrete-900">Customer</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div>
                <dt className="text-concrete-500">Address</dt>
                <dd className="font-semibold">
                  {order.fullAddress}, {order.city}, {order.governorate}
                </dd>
              </div>
              <div>
                <dt className="text-concrete-500">WhatsApp</dt>
                <dd>{order.whatsapp || "Not provided"}</dd>
              </div>
              <div>
                <dt className="text-concrete-500">Notes</dt>
                <dd>{order.notes || "No notes"}</dd>
              </div>
              {order.internalNotes ? (
                <div>
                  <dt className="text-concrete-500">Internal notes</dt>
                  <dd>{order.internalNotes}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div className="rounded-md border border-concrete-100 bg-white p-5 shadow-soft">
            <h2 className="text-xl font-bold text-concrete-900">Totals</h2>
            <dl className="mt-4 grid gap-2 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatMoney(order.subtotal)}</dd>
              </div>
              {Number(order.discountTotal) > 0 ? (
                <div className="flex justify-between text-emerald-700">
                  <dt>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt>
                  <dd>−{formatMoney(order.discountTotal)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt>Shipping</dt>
                <dd>{formatMoney(order.shippingCost)}</dd>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <dt>Total</dt>
                <dd>{formatMoney(order.grandTotal)}</dd>
              </div>
            </dl>
          </div>

          <ActionForm action={updateOrderStatusAction} submitLabel="Update status">
            <input name="orderId" type="hidden" value={order.id} />
            <label className="grid gap-2 text-sm font-medium">
              Status
              <select className="min-h-11 w-full rounded-md border border-concrete-200 bg-white px-3" defaultValue={order.status} name="status">
                {Object.values(OrderStatus).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <Field label="Internal note">
              <Textarea name="note" />
            </Field>
          </ActionForm>
        </aside>
      </div>
    </AdminShell>
  );
}
