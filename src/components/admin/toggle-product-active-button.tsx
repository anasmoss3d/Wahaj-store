"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, RotateCcw } from "lucide-react";
import { useAdminI18n } from "@/components/admin/admin-i18n-context";

/**
 * Toggles a product between Active (storefront-visible) and Archived (`active: false`).
 */
export function ToggleProductActiveButton({
  id,
  name,
  active
}: {
  id: string;
  name: string;
  active: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { dict } = useAdminI18n();
  const working = busy || isPending;

  const toggleActive = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active })
      });
      const body = await response.json();
      if (!response.ok || !body.ok) {
        setError(body.message ?? dict.products.statusUpdateError);
        setBusy(false);
        return;
      }
      startTransition(() => {
        router.refresh();
      });
      setBusy(false);
    } catch {
      setError(dict.common.networkError);
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        aria-label={
          active
            ? `${dict.products.archiveAriaPrefix} ${name}`
            : `${dict.products.restoreAriaPrefix} ${name}`
        }
        className={
          active
            ? "inline-flex min-h-10 items-center gap-2 rounded-full border border-[#DFD5C6] bg-[#FAF8F5] px-4 text-xs sm:text-sm font-medium text-[#57534E] transition hover:border-[#B85A2D]/40 hover:bg-[#F3ECE2] hover:text-[#1C1917] disabled:opacity-50"
            : "inline-flex min-h-10 items-center gap-2 rounded-full border border-[#CBD5C8] bg-[#E7ECE5] px-4 text-xs sm:text-sm font-medium text-[#2F463B] transition hover:bg-[#DCE4D9] disabled:opacity-50"
        }
        disabled={working}
        onClick={toggleActive}
        type="button"
      >
        {active ? (
          <>
            <Archive size={16} />{" "}
            {working ? dict.products.archiving : dict.products.archive}
          </>
        ) : (
          <>
            <RotateCcw size={16} />{" "}
            {working ? dict.products.restoring : dict.products.restore}
          </>
        )}
      </button>
      {error ? <span className="text-xs text-red-700">{error}</span> : null}
    </div>
  );
}
