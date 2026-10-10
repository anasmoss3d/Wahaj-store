import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  children
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-concrete-800">
      <span>{label}</span>
      {children}
      {hint ? <span className="text-xs font-normal text-concrete-500">{hint}</span> : null}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-11 rounded-md border border-concrete-200 bg-white px-3 text-sm text-concrete-900 outline-none transition placeholder:text-concrete-400 focus:border-wahaj-teal focus:ring-2 focus:ring-wahaj-teal/15",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 rounded-md border border-concrete-200 bg-white px-3 py-3 text-sm text-concrete-900 outline-none transition placeholder:text-concrete-400 focus:border-wahaj-teal focus:ring-2 focus:ring-wahaj-teal/15",
        className
      )}
      {...props}
    />
  );
}
