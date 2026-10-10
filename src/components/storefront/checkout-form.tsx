"use client";

import { useActionState } from "react";
import { checkoutAction } from "@/app/actions/checkout";
import { Field, Input, Textarea } from "@/components/ui/input";
import { FormMessage, SubmitButton } from "@/components/ui/form-message";

export function CheckoutForm() {
  const [state, action] = useActionState(checkoutAction, {});

  return (
    <form action={action} className="grid gap-4 rounded-md border border-concrete-100 bg-white p-5 shadow-soft">
      <FormMessage error={state.error} success={state.success} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Customer name">
          <Input name="customerName" required />
        </Field>
        <Field label="Phone number">
          <Input name="phone" placeholder="010..." required />
        </Field>
        <Field label="WhatsApp number">
          <Input name="whatsapp" placeholder="Optional" />
        </Field>
        <Field label="Email">
          <Input name="email" placeholder="Optional" type="email" />
        </Field>
        <Field label="Governorate">
          <Input name="governorate" required />
        </Field>
        <Field label="City / Area">
          <Input name="city" required />
        </Field>
      </div>
      <Field label="Full address">
        <Textarea name="fullAddress" required />
      </Field>
      <Field label="Building / Apartment">
        <Input name="building" />
      </Field>
      <Field label="Notes">
        <Textarea name="notes" />
      </Field>
      <div className="rounded-md bg-concrete-50 p-4 text-sm text-concrete-700">
        Payment method: <strong>Cash on Delivery</strong>
      </div>
      <SubmitButton>Place COD order</SubmitButton>
    </form>
  );
}
