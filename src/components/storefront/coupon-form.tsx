"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { applyCouponAction, removeCouponAction } from "@/app/actions/shop";
import { FormMessage, SubmitButton } from "@/components/ui/form-message";
import { formatMoney } from "@/lib/money";
import type { Locale } from "@/lib/i18n";

export function CouponForm({
  couponCode,
  discountCents,
  labels,
  locale = "en"
}: {
  couponCode: string | null;
  discountCents: number;
  labels: { apply: string; remove: string; placeholder: string; saving: string };
  locale?: Locale;
}) {
  const router = useRouter();
  const [state, action] = useActionState(applyCouponAction, {});

  async function remove() {
    await removeCouponAction();
    router.refresh();
  }

  if (couponCode) {
    return (
      <div className="flex items-center justify-between rounded-full border border-[#CBD5C8] bg-[#E7ECE5]/80 px-4 py-2.5 text-sm">
        <span>
          <strong className="text-[#1C1917]">{couponCode}</strong>
          <span className="ms-2 font-medium text-[#2F463B]">−{formatMoney(String(discountCents / 100), "EGP", locale)}</span>
        </span>
        <button className="text-xs font-semibold text-red-700 hover:underline" onClick={remove} type="button">
          {labels.remove}
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-2">
      <FormMessage error={state.error} success={state.success} />
      <div className="flex gap-2">
        <input
          className="min-h-11 w-full rounded-full border border-[#DED7CB] bg-white px-4 text-sm text-[#1C1917] placeholder:text-[#A8A29E] outline-none focus:border-[#B85A2D] focus:ring-2 focus:ring-[#B85A2D]/20"
          name="code"
          placeholder={labels.placeholder}
        />
        <SubmitButton pendingLabel={labels.saving} className="bg-[#1C1917] shadow-sm hover:bg-[#B85A2D]">{labels.apply}</SubmitButton>
      </div>
    </form>
  );
}
