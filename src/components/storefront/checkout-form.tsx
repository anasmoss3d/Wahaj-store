"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { checkoutAction } from "@/app/actions/checkout";
import { Field, Input, Textarea } from "@/components/ui/input";
import { FormMessage, SubmitButton } from "@/components/ui/form-message";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Dictionary, Locale } from "@/lib/i18n";

export function CheckoutForm({
  labels,
  governorates,
  rates,
  flatRate,
  thresholdCents,
  subtotalCents,
  discountCents,
  hasCustomColor,
  instapay,
  defaults,
  locale = "en"
}: {
  labels: Dictionary;
  governorates: string[];
  rates: Array<{ governorate: string; rate: number }>;
  flatRate: number;
  thresholdCents: number;
  subtotalCents: number;
  discountCents: number;
  hasCustomColor: boolean;
  instapay: { handle: string; qrImage: string; link: string };
  defaults?: { name: string; phone: string; email: string };
  locale?: Locale;
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
  const grandText = formatMoney(String(grandCents / 100), "EGP", locale);

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
      <form action={action} className="grid gap-5 rounded-2xl border border-[#E5DDD0] bg-white p-6 sm:p-8 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]">
        <FormMessage error={state.error} success={state.success} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={labels.customerName}>
            <Input defaultValue={defaults?.name} name="customerName" required />
          </Field>
          <Field label={labels.phoneNumber}>
            <Input defaultValue={defaults?.phone} name="phone" placeholder="010..." required />
          </Field>
          <Field label={`${labels.whatsappNumber} (${labels.optional})`}>
            <Input name="whatsapp" placeholder={labels.optional} />
          </Field>
          <Field label={`${labels.email} (${labels.optional})`}>
            <Input defaultValue={defaults?.email} name="email" placeholder={labels.optional} type="email" />
          </Field>
          <Field label={labels.governorate}>
            <select
              className="min-h-11 w-full min-w-0 rounded-xl border border-[#DED7CB] bg-white px-4 text-sm text-[#1C1917] outline-none transition-all focus:border-[#B85A2D] focus:ring-2 focus:ring-[#B85A2D]/20"
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
        <Field label={labels.notes} hint={hasCustomColor ? labels.customColorNotesHint : undefined}>
          <Textarea name="notes" />
        </Field>

        <div className="grid gap-3 pt-1">
          <h2 className="font-editorial text-lg font-bold text-[#1C1917]">{labels.paymentMethod}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label
              className={cn(
                "cursor-pointer rounded-2xl border px-4 py-3.5 text-sm font-semibold transition-all",
                !isInstapay
                  ? "border-[#B85A2D] bg-[#FAF8F5] text-[#1C1917] shadow-sm"
                  : "border-[#DED7CB] bg-white text-[#57534E] hover:border-[#B85A2D]/50"
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
                "cursor-pointer rounded-2xl border px-4 py-3.5 text-sm font-semibold transition-all",
                isInstapay
                  ? "border-[#B85A2D] bg-[#FAF8F5] text-[#1C1917] shadow-sm"
                  : "border-[#DED7CB] bg-white text-[#57534E] hover:border-[#B85A2D]/50"
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
            <div className="grid gap-4 rounded-3xl border border-[#E5DDD0] bg-[#F2ECE4]/75 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-5">
                {instapay.qrImage ? (
                  <Image
                    alt="InstaPay QR"
                    className="h-32 w-32 rounded-2xl border border-[#DED7CB] bg-white object-contain p-1"
                    height={128}
                    src={instapay.qrImage}
                    width={128}
                  />
                ) : null}
                <div className="text-sm">
                  <p className="text-[#665E57] font-light">{labels.payToHandle}</p>
                  <p className="text-lg font-bold text-[#1C1917]" dir="ltr">
                    {instapay.handle}
                  </p>
                  <p className="mt-2.5 text-[#665E57] font-light">{labels.amountToPay}</p>
                  <p className="flex flex-wrap items-center gap-2.5 font-editorial text-2xl font-black text-[#B85A2D]">
                    {grandText}
                    <button
                      className="rounded-full border border-[#DED7CB] bg-white px-3 py-1 font-sans text-xs font-medium text-[#1C1917] transition hover:border-[#B85A2D]"
                      onClick={copyAmount}
                      type="button"
                    >
                      {copied ? labels.copied : labels.copyAmount}
                    </button>
                  </p>
                  {instapay.link ? (
                    <a
                      className="mt-3 inline-flex min-h-10 items-center rounded-full bg-[#1C1917] px-5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-[#B85A2D]"
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
                  className="min-h-11 w-full rounded-xl border border-[#DED7CB] bg-white px-3.5 py-2.5 text-sm text-[#1C1917] file:me-3 file:rounded-full file:border-0 file:bg-[#F4EFEB] file:px-4 file:py-1 file:text-xs file:font-medium file:text-[#1C1917]"
                  name="receipt"
                  onChange={(event) => setReceiptName(event.target.files?.[0]?.name ?? "")}
                  required={isInstapay}
                  type="file"
                />
              </Field>
              {receiptName ? (
                <p className="text-sm font-medium text-[#2F463B]">{receiptName}</p>
              ) : (
                <p className="text-sm text-[#78716C] font-light">{labels.receiptHint}</p>
              )}
            </div>
          ) : null}
        </div>

        <div className="grid gap-2.5 rounded-2xl border border-[#E8E2D8] bg-[#FAF8F5] p-5 text-sm text-[#57534E]">
          <div className="flex justify-between">
            <span>{labels.shipping}</span>
            <strong className="text-[#1C1917]">{shippingCents === 0 ? labels.free : formatMoney(String(shippingCents / 100), "EGP", locale)}</strong>
          </div>
          <div className="flex justify-between border-t border-[#EDE8E0] pt-2.5 text-base font-bold text-[#1C1917]">
            <span>{labels.grandTotal}</span>
            <span className="font-editorial text-xl text-[#B85A2D]">{grandText}</span>
          </div>
          <span className="text-xs text-[#8C827A]">{isInstapay ? labels.instapayName : labels.cashOnDelivery}</span>
        </div>
        <SubmitButton pendingLabel={labels.saving}>
          {isInstapay ? labels.placeOrder : labels.placeCodOrder}
        </SubmitButton>
      </form>
    </div>
  );
}
