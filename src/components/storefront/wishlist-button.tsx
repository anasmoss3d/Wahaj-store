"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleWishlistAction } from "@/app/actions/shop";
import { cn } from "@/lib/utils";

export function WishlistButton({
  productId,
  initialSaved,
  isLoggedIn,
  labels
}: {
  productId: string;
  initialSaved: boolean;
  isLoggedIn: boolean;
  labels: { save: string; remove: string; login: string };
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  function toggle() {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    startTransition(async () => {
      const result = await toggleWishlistAction(productId);
      if (result.error === "LOGIN_REQUIRED") {
        router.push("/auth/login");
        return;
      }
      if (!result.error) {
        setSaved(result.success === "ADDED");
        router.refresh();
      }
    });
  }

  return (
    <button
      aria-label={saved ? labels.remove : isLoggedIn ? labels.save : labels.login}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition disabled:opacity-50",
        saved
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-concrete-200 bg-white text-concrete-700 hover:border-red-200"
      )}
      disabled={pending}
      onClick={toggle}
      title={saved ? labels.remove : isLoggedIn ? labels.save : labels.login}
      type="button"
    >
      <Heart size={18} fill={saved ? "currentColor" : "none"} />
      <span className="hidden sm:inline">{saved ? labels.remove : labels.save}</span>
    </button>
  );
}
