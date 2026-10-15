"use client";

import { useActionState } from "react";
import {
  adminLoginAction,
  customerLoginAction,
  customerRegisterAction
} from "@/app/actions/auth";
import { Field, Input } from "@/components/ui/input";
import { FormMessage, SubmitButton } from "@/components/ui/form-message";
import type { Dictionary } from "@/lib/i18n";

export function CustomerLoginForm({ labels }: { labels: Dictionary }) {
  const [state, action] = useActionState(customerLoginAction, {});
  return (
    <form action={action} className="grid gap-4">
      <FormMessage error={state.error} success={state.success} />
      <Field label={labels.emailOrPhone}>
        <Input name="email" required />
      </Field>
      <Field label={labels.password}>
        <Input name="password" required type="password" />
      </Field>
      <SubmitButton pendingLabel={labels.saving}>{labels.signIn}</SubmitButton>
    </form>
  );
}

export function CustomerRegisterForm({ labels }: { labels: Dictionary }) {
  const [state, action] = useActionState(customerRegisterAction, {});
  return (
    <form action={action} className="grid gap-4">
      <FormMessage error={state.error} success={state.success} />
      <Field label={labels.name}>
        <Input name="name" required />
      </Field>
      <Field label={labels.phoneNumber}>
        <Input name="phone" required />
      </Field>
      <Field label={`${labels.email} (${labels.optional})`}>
        <Input name="email" type="email" />
      </Field>
      <Field label={labels.password}>
        <Input name="password" required type="password" />
      </Field>
      <SubmitButton pendingLabel={labels.saving}>{labels.createAccount}</SubmitButton>
    </form>
  );
}

export function AdminLoginForm() {
  const [state, action] = useActionState(adminLoginAction, {});
  return (
    <form action={action} className="grid gap-4 rounded-md border border-concrete-100 bg-white p-6 shadow-soft">
      <FormMessage error={state.error} success={state.success} />
      <Field label="Admin email">
        <Input autoComplete="email" name="email" required type="email" />
      </Field>
      <Field label="Password">
        <Input autoComplete="current-password" name="password" required type="password" />
      </Field>
      <SubmitButton>Open dashboard</SubmitButton>
    </form>
  );
}
