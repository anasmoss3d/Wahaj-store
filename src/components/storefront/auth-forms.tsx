"use client";

import { useActionState } from "react";
import {
  adminLoginAction,
  customerLoginAction,
  customerRegisterAction
} from "@/app/actions/auth";
import { Field, Input } from "@/components/ui/input";
import { FormMessage, SubmitButton } from "@/components/ui/form-message";

export function CustomerLoginForm() {
  const [state, action] = useActionState(customerLoginAction, {});
  return (
    <form action={action} className="grid gap-4">
      <FormMessage error={state.error} success={state.success} />
      <Field label="Email or phone">
        <Input name="email" required />
      </Field>
      <Field label="Password">
        <Input name="password" required type="password" />
      </Field>
      <SubmitButton>Sign in</SubmitButton>
    </form>
  );
}

export function CustomerRegisterForm() {
  const [state, action] = useActionState(customerRegisterAction, {});
  return (
    <form action={action} className="grid gap-4">
      <FormMessage error={state.error} success={state.success} />
      <Field label="Name">
        <Input name="name" required />
      </Field>
      <Field label="Phone">
        <Input name="phone" required />
      </Field>
      <Field label="Email">
        <Input name="email" type="email" />
      </Field>
      <Field label="Password">
        <Input name="password" required type="password" />
      </Field>
      <SubmitButton>Create account</SubmitButton>
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
