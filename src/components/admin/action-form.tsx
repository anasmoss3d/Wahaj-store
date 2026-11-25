"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/actions/auth";
import { useAdminI18n } from "@/components/admin/admin-i18n-context";
import { FormMessage, SubmitButton } from "@/components/ui/form-message";

export function ActionForm({
  action,
  children,
  submitLabel
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, {});
  const { dict } = useAdminI18n();

  return (
    <form
      action={formAction}
      className="grid min-w-0 gap-4 rounded-2xl border border-[#E5DDD0] bg-white p-5 sm:p-6 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]"
    >
      <FormMessage error={state.error} success={state.success} />
      {children}
      <SubmitButton pendingLabel={dict.common.saving}>
        {submitLabel ?? dict.common.save}
      </SubmitButton>
    </form>
  );
}
