"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
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

type LoginFormProps = Omit<React.ComponentProps<"form">, "action"> & {
  labels: Dictionary;
  locale: Locale;
  safeNext?: string | null;
  resetSuccess?: boolean;
  onSwitchToRegister?: () => void;
  onSwitchToReset?: () => void;
};

export function LoginForm({
  className,
  labels,
  locale,
  safeNext,
  resetSuccess = false,
  onSwitchToRegister,
  onSwitchToReset,
  ...props
}: LoginFormProps) {
  const [state, action] = useActionState(loginAction, {});
  const isArabic = locale === "ar";
  const isAdminNext = Boolean(safeNext && (safeNext === "/admin" || safeNext.startsWith("/admin/")));
  const isCheckoutNext = Boolean(safeNext && safeNext.startsWith("/checkout"));

  return (
    <form
      action={action}
      className={cn("flex flex-col gap-5", className)}
      {...props}
    >
      <input type="hidden" name="next" value={safeNext ?? ""} />
      <FieldGroup>
        <div className="flex flex-col items-center gap-1.5 text-center">
          <h1
            className={cn(
              "font-editorial text-3xl sm:text-4xl font-black text-[#1C1917]",
              isArabic ? "" : "tracking-tight"
            )}
          >
            {labels.signIn}
          </h1>
          <p className="text-sm text-balance font-light leading-relaxed text-[#665E57]">
            {isAdminNext ? labels.adminLoginRequired : labels.loginSubtitle}
          </p>
        </div>

        {isCheckoutNext ? (
          <div className="rounded-2xl border border-[#E5DDD0] bg-[#FAF8F5] px-4 py-3 text-xs sm:text-sm leading-relaxed text-[#57534E]">
            {labels.checkoutLoginNotice}
          </div>
        ) : null}

        <FormMessage
          error={state.error}
          success={state.success || (resetSuccess ? labels.resetSuccessBanner : undefined)}
        />

        <Field>
          <FieldLabel htmlFor="login-identifier">{labels.emailOrPhone}</FieldLabel>
          <Input
            id="login-identifier"
            name="identifier"
            type="text"
            inputMode="email"
            autoComplete="username"
            dir="ltr"
            placeholder="you@example.com / 01012345678"
            className="w-full"
            required
          />
        </Field>

        <Field>
          <div className="flex items-center justify-between gap-2">
            <FieldLabel htmlFor="login-password">{labels.password}</FieldLabel>
            <a
              href="/auth/reset-password"
              onClick={(event) => {
                if (!onSwitchToReset) return;
                event.preventDefault();
                onSwitchToReset();
              }}
              className="text-xs font-medium text-[#665E57] underline-offset-4 transition-colors hover:text-[#B85A2D] hover:underline"
            >
              {labels.forgotPassword}
            </a>
          </div>
          <PasswordInput
            id="login-password"
            name="password"
            autoComplete="current-password"
            showLabel={labels.showPassword}
            hideLabel={labels.hidePassword}
            required
          />
        </Field>

        <Field>
          <SubmitButton className="w-full" pendingLabel={labels.saving}>
            {labels.signIn}
          </SubmitButton>
        </Field>

        <FieldSeparator />

        <FieldDescription className="text-center">
          {labels.newToWahaj}{" "}
          <a
            href={safeNext ? `/auth/register?next=${encodeURIComponent(safeNext)}` : "/auth/register"}
            onClick={(event) => {
              if (!onSwitchToRegister) return;
              event.preventDefault();
              onSwitchToRegister();
            }}
            className="font-semibold text-[#B85A2D] underline-offset-4 hover:underline"
          >
            {labels.createAccount}
          </a>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
