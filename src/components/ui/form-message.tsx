"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FormMessage({ error, success }: { error?: string; success?: string }) {
  if (!error && !success) return null;

  return (
    <p
      className={cn(
        "rounded-xl border px-4 py-2.5 text-sm",
        error
          ? "border-red-200 bg-red-50/90 text-red-800"
          : "border-[#CBD5C8] bg-[#E7ECE5]/80 text-[#2F463B]"
      )}
    >
      {error || success}
    </p>
  );
}

export function SubmitButton({
  children,
  className,
  pendingLabel = "Saving..."
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button className={className} disabled={pending} type="submit">
      {pending ? pendingLabel : children}
    </Button>
  );
}
