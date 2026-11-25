"use client";

import { useActionState, useEffect, useState } from "react";
import {
  requestPasswordResetAction,
  resetPasswordAction
} from "@/app/actions/auth";
import { PasswordInput } from "@/components/storefront/auth/password-input";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator
} from "@/components/ui/field";
import { FormMessage, SubmitButton } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import type { Dictionary, Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type ResetPasswordFormProps = {
  labels: Dictionary;
  locale: Locale;
  initialToken?: string;
  onSwitchToLogin?: () => void;
};

export function ResetPasswordForm({
  labels,
  locale,
  initialToken = "",
  onSwitchToLogin
}: ResetPasswordFormProps) {
  const [token] = useState(initialToken.trim());
  const [requestState, requestAction] = useActionState(requestPasswordResetAction, {});
  const [confirmState, confirmAction] = useActionState(resetPasswordAction, {});
  const isArabic = locale === "ar";
  const hasToken = token.length > 0;

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("token=")) {
      window.history.replaceState(null, "", "/auth/reset-password");
    }
  }, []);

  if (hasToken) {
    return (
      <form action={confirmAction} className="flex flex-col gap-5">
        <input type="hidden" name="token" value={token} />
        <FieldGroup>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <h1
              className={cn(
                "font-editorial text-3xl sm:text-4xl font-black text-[#1C1917]",
                isArabic ? "" : "tracking-tight"
              )}
            >
              {labels.resetPasswordNewTitle}
            </h1>
            <p className="text-sm text-balance font-light leading-relaxed text-[#665E57]">
              {labels.resetPasswordNewSubtitle}
            </p>
          </div>

          <FormMessage error={confirmState.error} success={confirmState.success} />

          <Field>
            <FieldLabel htmlFor="reset-password">{labels.password}</FieldLabel>
            <PasswordInput
              id="reset-password"
              name="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              showLabel={labels.showPassword}
              hideLabel={labels.hidePassword}
              required
            />
            <FieldDescription>{labels.passwordHint}</FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="reset-confirm-password">{labels.confirmPassword}</FieldLabel>
            <PasswordInput
              id="reset-confirm-password"
              name="confirmPassword"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              showLabel={labels.showPassword}
              hideLabel={labels.hidePassword}
              required
            />
            <FieldDescription>{labels.confirmPasswordHint}</FieldDescription>
          </Field>

          <Field>
            <SubmitButton className="w-full" pendingLabel={labels.saving}>
              {labels.updatePassword}
            </SubmitButton>
          </Field>

          <FieldSeparator />

          <FieldDescription className="text-center">
            <a
              href="/auth/login"
              onClick={(event) => {
                if (!onSwitchToLogin) return;
                event.preventDefault();
                onSwitchToLogin();
              }}
              className="font-semibold text-[#B85A2D] underline-offset-4 hover:underline"
            >
              {labels.backToLogin}
            </a>
          </FieldDescription>
        </FieldGroup>
      </form>
    );
  }

  return (
    <form action={requestAction} className="flex flex-col gap-5">
      <FieldGroup>
        <div className="flex flex-col items-center gap-1.5 text-center">
          <h1
            className={cn(
              "font-editorial text-3xl sm:text-4xl font-black text-[#1C1917]",
              isArabic ? "" : "tracking-tight"
            )}
          >
            {labels.resetPasswordTitle}
          </h1>
          <p className="text-sm text-balance font-light leading-relaxed text-[#665E57]">
            {labels.resetPasswordSubtitle}
          </p>
        </div>

        <FormMessage error={requestState.error} success={requestState.success} />

        <Field>
          <FieldLabel htmlFor="reset-email">{labels.email}</FieldLabel>
          <Input
            id="reset-email"
            name="email"
            type="email"
            autoComplete="email"
            dir="ltr"
            placeholder="you@example.com"
            className="w-full"
            required
          />
        </Field>

        <Field>
          <SubmitButton className="w-full" pendingLabel={labels.saving}>
            {labels.sendResetLink}
          </SubmitButton>
        </Field>

        <FieldSeparator />

        <FieldDescription className="text-center">
          <a
            href="/auth/login"
            onClick={(event) => {
              if (!onSwitchToLogin) return;
              event.preventDefault();
              onSwitchToLogin();
            }}
            className="font-semibold text-[#B85A2D] underline-offset-4 hover:underline"
          >
            {labels.backToLogin}
          </a>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
