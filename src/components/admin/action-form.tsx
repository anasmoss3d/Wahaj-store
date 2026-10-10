"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/actions/auth";
import { FormMessage, SubmitButton } from "@/components/ui/form-message";

export function ActionForm({
  action,
  children,
  submitLabel = "Save"
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className="grid gap-4 rounded-md border border-concrete-100 bg-white p-5 shadow-soft">
      <FormMessage error={state.error} success={state.success} />
      {children}
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
