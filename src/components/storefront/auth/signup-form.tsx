"use client";

import { useActionState } from "react";
import { registerAction } from "@/app/actions/auth";
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

type SignupFormProps = Omit<React.ComponentProps<"form">, "action"> & {
  labels: Dictionary;
  locale: Locale;
  safeNext?: string | null;
  onSwitchToLogin?: () => void;
};

export function SignupForm({
  className,
  labels,
  locale,
  safeNext,
  onSwitchToLogin,
  ...props
}: SignupFormProps) {
  const [state, action] = useActionState(registerAction, {});
  const isArabic = locale === "ar";
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
            {labels.registerTitle}
          </h1>
          <p className="text-sm text-balance font-light leading-relaxed text-[#665E57]">
            {labels.registerSubtitle}
          </p>
        </div>

        {isCheckoutNext ? (
          <div className="rounded-2xl border border-[#E5DDD0] bg-[#FAF8F5] px-4 py-3 text-xs sm:text-sm leading-relaxed text-[#57534E]">
            {labels.checkoutLoginNotice}
          </div>
        ) : null}

        <FormMessage error={state.error} success={state.success} />

        <Field>
          <FieldLabel htmlFor="signup-name">{labels.name}</FieldLabel>
          <Input
            id="signup-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder={isArabic ? "الاسم بالكامل" : "Mona Ali"}
            className="w-full"
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="signup-phone">{labels.phoneNumber}</FieldLabel>
          <Input
            id="signup-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            placeholder="01012345678"
            className="w-full"
            required
          />
          <FieldDescription>{labels.phoneHint}</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="signup-email">
            {`${labels.email} (${labels.optional})`}
          </FieldLabel>
          <Input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            dir="ltr"
            placeholder="you@example.com"
            className="w-full"
          />
        </Field>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
          <Field>
            <FieldLabel htmlFor="signup-password">{labels.password}</FieldLabel>
            <PasswordInput
              id="signup-password"
              name="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              showLabel={labels.showPassword}
              hideLabel={labels.hidePassword}
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="signup-confirm-password">{labels.confirmPassword}</FieldLabel>
            <PasswordInput
              id="signup-confirm-password"
              name="confirmPassword"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              showLabel={labels.showPassword}
              hideLabel={labels.hidePassword}
              required
            />
          </Field>
          <FieldDescription className="sm:col-span-2 -mt-1 sm:-mt-2">
            {labels.passwordHint}
          </FieldDescription>
        </div>

        <Field>
          <SubmitButton className="w-full" pendingLabel={labels.saving}>
            {labels.createAccount}
          </SubmitButton>
        </Field>

        <FieldSeparator />

        <FieldDescription className="text-center">
          {labels.alreadyRegistered}{" "}
          <a
            href={safeNext ? `/auth/login?next=${encodeURIComponent(safeNext)}` : "/auth/login"}
            onClick={(event) => {
              if (!onSwitchToLogin) return;
              event.preventDefault();
              onSwitchToLogin();
            }}
            className="font-semibold text-[#B85A2D] underline-offset-4 hover:underline"
          >
            {labels.signIn}
          </a>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
