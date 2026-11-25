"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  showLabel: string;
  hideLabel: string;
};

export function PasswordInput({
  className,
  showLabel,
  hideLabel,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative" dir="ltr">
      <Input
        dir="ltr"
        type={visible ? "text" : "password"}
        className={cn("w-full pe-11", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? hideLabel : showLabel}
        className="absolute inset-y-0 end-0 flex items-center px-3.5 text-[#78716C] transition-colors hover:text-[#1C1917] focus-visible:outline-none focus-visible:text-[#B85A2D]"
      >
        {visible ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
      </button>
    </div>
  );
}
