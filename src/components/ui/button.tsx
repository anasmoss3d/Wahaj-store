import type { ButtonHTMLAttributes, AnchorHTMLAttributes, PropsWithChildren } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-wahaj-teal text-white hover:bg-wahaj-teal/90",
  secondary: "bg-concrete-900 text-white hover:bg-concrete-800",
  ghost: "bg-transparent text-concrete-800 hover:bg-concrete-100",
  danger: "bg-red-600 text-white hover:bg-red-700"
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export function ButtonLink({
  className,
  variant = "primary",
  children,
  ...props
}: PropsWithChildren<AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; variant?: ButtonVariant }>) {
  return (
    <Link
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
