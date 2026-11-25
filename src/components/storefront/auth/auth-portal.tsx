"use client";

import { useState } from "react";
import { LoginForm } from "@/components/storefront/auth/login-form";
import { ResetPasswordForm } from "@/components/storefront/auth/reset-password-form";
import { SignupForm } from "@/components/storefront/auth/signup-form";
import type { Dictionary, Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type AuthMode = "login" | "register" | "reset";

function buildModeUrl(
  mode: AuthMode,
  unifiedPath: boolean,
  safeNext?: string | null
) {
  const params = new URLSearchParams();
  if (unifiedPath) {
    if (mode !== "login") params.set("mode", mode);
    if (safeNext) params.set("next", safeNext);
    const qs = params.toString();
    return qs ? `/auth?${qs}` : "/auth";
  }

  const base =
    mode === "register"
      ? "/auth/register"
      : mode === "reset"
        ? "/auth/reset-password"
        : "/auth/login";

  if (mode !== "reset" && safeNext) {
    params.set("next", safeNext);
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export function AuthPortal({
  initialMode = "login",
  labels,
  locale,
  safeNext = null,
  resetSuccess = false,
  resetToken = "",
  unifiedPath = false
}: {
  initialMode?: AuthMode;
  labels: Dictionary;
  locale: Locale;
  safeNext?: string | null;
  resetSuccess?: boolean;
  resetToken?: string;
  unifiedPath?: boolean;
}) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  function switchMode(nextMode: AuthMode) {
    if (nextMode === mode) return;
    setMode(nextMode);
    if (typeof window !== "undefined") {
      window.history.replaceState(
        null,
        "",
        buildModeUrl(nextMode, unifiedPath, safeNext)
      );
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label={labels.account}
        className="grid grid-cols-2 rounded-full border border-[#E5DDD0] bg-[#FAF8F5] p-1 shadow-sm"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          onClick={() => switchMode("login")}
          className={cn(
            "min-h-10 rounded-full px-4 text-xs sm:text-sm font-medium transition-all duration-300",
            mode === "login"
              ? "bg-[#1C1917] text-white shadow-sm"
              : "text-[#665E57] hover:text-[#1C1917]"
          )}
        >
          {labels.signIn}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "register"}
          onClick={() => switchMode("register")}
          className={cn(
            "min-h-10 rounded-full px-4 text-xs sm:text-sm font-medium transition-all duration-300",
            mode === "register"
              ? "bg-[#1C1917] text-white shadow-sm"
              : "text-[#665E57] hover:text-[#1C1917]"
          )}
        >
          {labels.createAccount}
        </button>
      </div>

      {mode === "login" ? (
        <LoginForm
          key="login"
          labels={labels}
          locale={locale}
          safeNext={safeNext}
          resetSuccess={resetSuccess}
          onSwitchToRegister={() => switchMode("register")}
          onSwitchToReset={() => switchMode("reset")}
        />
      ) : mode === "register" ? (
        <SignupForm
          key="register"
          labels={labels}
          locale={locale}
          safeNext={safeNext}
          onSwitchToLogin={() => switchMode("login")}
        />
      ) : (
        <ResetPasswordForm
          key="reset"
          labels={labels}
          locale={locale}
          initialToken={resetToken}
          onSwitchToLogin={() => switchMode("login")}
        />
      )}
    </div>
  );
}
