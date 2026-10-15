"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { checkoutAction } from "@/app/actions/checkout";
import { Field, Input, Textarea } from "@/components/ui/input";
import { FormMessage, SubmitButton } from "@/components/ui/form-message";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n";

export function CheckoutForm({
  labels,
  governorates,
  rates,
  flatRate,
  thresholdCents,
  subtotalCents,
  discountCents,
  instapay
}: {
  labels: Dictionary;
  governorates: string[];
  rates: Array<{ governorate: string; rate: number }>;
  flatRate: number;
  thresholdCents: number;
  subtotalCents: number;
  discountCents: number;
  instapay: { handle: string; qrImage: string; link: string };
}) {
  const [state, action] = useActionState(checkoutAction, {});
  const [governorate, setGovernorate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH_ON_DELIVERY");
  const [receiptName, setReceiptName] = useState("");
  const [copied, setCopied] = useState(false);

  const netCents = subtotalCents - discountCents;
  const rateMap = new Map(rates.map((row) => [row.governorate, Math.round(row.rate * 100)]));
  const shippingCents =
    thresholdCents > 0 && netCents >= thresholdCents
      ? 0
      : governorate && rateMap.has(governorate)
        ? (rateMap.get(governorate) ?? Math.round(flatRate * 100))
        : Math.round(flatRate * 100);
  const grandCents = netCents + shippingCents;
  const isInstapay = paymentMethod === "INSTAPAY";
  const grandText = formatMoney(String(grandCents / 100));

  async function copyAmount() {
    try {
      await navigator.clipboard.writeText(String(grandCents / 100));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="grid gap-6">
      <form action={action} className="grid gap-4 rounded-md border border-concrete-100 bg-white p-5 shadow-soft">
        <FormMessage error={state.error} success={state.success} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={labels.customerName}>
            <Input name="customerName" required />
          </Field>
          <Field label={labels.phoneNumber}>
            <Input name="phone" placeholder="010..." required />
          </Field>
          <Field label={`${labels.whatsappNumber} (${labels.optional})`}>
            <Input name="whatsapp" placeholder={labels.optional} />
          </Field>
          <Field label={`${labels.email} (${labels.optional})`}>
            <Input name="email" placeholder={labels.optional} type="email" />
          </Field>
          <Field label={labels.governorate}>
            <select
              className="min-h-11 w-full min-w-0 rounded-md border border-concrete-200 bg-white px-3"
              name="governorate"
              onChange={(event) => setGovernorate(event.target.value)}
              required
              value={governorate}
            >
              <option value="">—</option>
              {governorates.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Field>
          <Field label={labels.cityArea}>
            <Input name="city" required />
          </Field>
        </div>
        <Field label={labels.fullAddress}>
          <Textarea name="fullAddress" required />
        </Field>
        <Field label={labels.building}>
          <Input name="building" />
        </Field>
        <Field label={labels.notes}>
          <Textarea name="notes" />
        </Field>

        <div className="grid gap-3">
          <h2 className="font-semibold text-concrete-900">{labels.paymentMethod}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label
              className={cn(
                "cursor-pointer rounded-md border px-4 py-3 text-sm font-semibold",
                !isInstapay ? "border-wahaj-teal bg-wahaj-teal/5" : "border-concrete-200 bg-white"
              )}
            >
              <input
                checked={!isInstapay}
                className="sr-only"
                name="paymentMethod"
                onChange={() => setPaymentMethod("CASH_ON_DELIVERY")}
                type="radio"
                value="CASH_ON_DELIVERY"
              />
              {labels.cashOnDelivery}
            </label>
            <label
              className={cn(
                "cursor-pointer rounded-md border px-4 py-3 text-sm font-semibold",
                isInstapay ? "border-wahaj-teal bg-wahaj-teal/5" : "border-concrete-200 bg-white"
              )}
            >
              <input
                className="sr-only"
                name="paymentMethod"
                onChange={() => setPaymentMethod("INSTAPAY")}
                type="radio"
                value="INSTAPAY"
              />
              {labels.instapayName}
            </label>
          </div>

          {isInstapay ? (
            <div className="grid gap-4 rounded-md bg-concrete-50 p-4">
              <div className="flex flex-wrap items-center gap-4">
                {instapay.qrImage ? (
                  <Image
                    alt="InstaPay QR"
                    className="h-32 w-32 rounded-md border border-concrete-200 bg-white object-contain"
                    height={128}
                    src={instapay.qrImage}
                    width={128}
                  />
                ) : null}
                <div className="text-sm">
                  <p className="text-concrete-600">{labels.payToHandle}</p>
                  <p className="text-lg font-bold text-concrete-900" dir="ltr">
                    {instapay.handle}
                  </p>
                  <p className="mt-2 text-concrete-600">{labels.amountToPay}</p>
                  <p className="flex flex-wrap items-center gap-2 text-2xl font-bold text-wahaj-teal">
                    {grandText}
                    <button
                      className="rounded-md border border-concrete-200 bg-white px-2 py-1 text-xs font-semibold text-concrete-700"
                      onClick={copyAmount}
                      type="button"
                    >
                      {copied ? labels.copied : labels.copyAmount}
                    </button>
                  </p>
                  {instapay.link ? (
                    <a
                      className="mt-3 inline-flex min-h-11 items-center rounded-md bg-wahaj-teal px-4 font-bold text-white"
                      href={instapay.link}
                      rel="noopener"
                      target="_blank"
                    >
                      {labels.payViaLink}
                    </a>
                  ) : null}
                </div>
              </div>
              <Field label={labels.uploadReceipt}>
                <input
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="min-h-11 w-full rounded-md border border-concrete-200 bg-white px-3 py-2 text-sm"
                  name="receipt"
                  onChange={(event) => setReceiptName(event.target.files?.[0]?.name ?? "")}
                  required={isInstapay}
                  type="file"
                />
              </Field>
              {receiptName ? (
                <p className="text-sm text-emerald-700">{receiptName}</p>
              ) : (
                <p className="text-sm text-concrete-500">{labels.receiptHint}</p>
              )}
            </div>
          ) : null}
        </div>

        <div className="grid gap-2 rounded-md bg-concrete-50 p-4 text-sm text-concrete-700">
          <div className="flex justify-between">
            <span>{labels.shipping}</span>
            <strong>{shippingCents === 0 ? labels.free : formatMoney(String(shippingCents / 100))}</strong>
          </div>
          <div className="flex justify-between text-base font-bold text-concrete-900">
            <span>{labels.grandTotal}</span>
            <span>{grandText}</span>
          </div>
          <span>{isInstapay ? labels.instapayName : labels.cashOnDelivery}</span>
        </div>
        <SubmitButton pendingLabel={labels.saving}>
          {isInstapay ? labels.placeOrder : labels.placeCodOrder}
        </SubmitButton>
      </form>
    </div>
  );
}
