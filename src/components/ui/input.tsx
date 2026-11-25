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
    <label className="grid min-w-0 content-start gap-2 text-sm font-medium text-[#1C1917]">
      <span className="leading-snug">{label}</span>
      {children}
      {hint ? <span className="text-xs font-light text-[#78716C]">{hint}</span> : null}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-11 w-full min-w-0 rounded-xl border border-[#DED7CB] bg-white px-4 text-sm text-[#1C1917] outline-none transition-all placeholder:text-[#A8A29E] focus:border-[#B85A2D] focus:ring-2 focus:ring-[#B85A2D]/20",
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
        "min-h-28 w-full min-w-0 rounded-xl border border-[#DED7CB] bg-white px-4 py-3 text-sm text-[#1C1917] outline-none transition-all placeholder:text-[#A8A29E] focus:border-[#B85A2D] focus:ring-2 focus:ring-[#B85A2D]/20",
        className
      )}
      {...props}
    />
  );
}
