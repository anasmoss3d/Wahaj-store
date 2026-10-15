"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { applyCouponAction, removeCouponAction } from "@/app/actions/shop";
import { FormMessage, SubmitButton } from "@/components/ui/form-message";
import { formatMoney } from "@/lib/money";

export function CouponForm({
  couponCode,
  discountCents,
  labels
}: {
  couponCode: string | null;
  discountCents: number;
  labels: { apply: string; remove: string; placeholder: string; saving: string };
}) {
  const router = useRouter();
  const [state, action] = useActionState(applyCouponAction, {});

  async function remove() {
    await removeCouponAction();
    router.refresh();
  }

  if (couponCode) {
    return (
      <div className="flex items-center justify-between rounded-md bg-emerald-50 px-4 py-3 text-sm">
        <span>
          <strong>{couponCode}</strong>
          <span className="ms-2 text-emerald-700">−{formatMoney(String(discountCents / 100))}</span>
        </span>
        <button className="font-semibold text-red-700 hover:underline" onClick={remove} type="button">
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
          className="min-h-11 w-full rounded-md border border-concrete-200 px-3 uppercase"
          name="code"
          placeholder={labels.placeholder}
        />
        <SubmitButton pendingLabel={labels.saving}>{labels.apply}</SubmitButton>
      </div>
    </form>
  );
}
