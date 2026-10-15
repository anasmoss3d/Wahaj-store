"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FormMessage({ error, success }: { error?: string; success?: string }) {
  if (!error && !success) return null;

  return (
    <p
      className={cn(
        "rounded-md px-3 py-2 text-sm",
        error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
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
