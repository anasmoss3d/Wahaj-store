"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useAdminI18n } from "@/components/admin/admin-i18n-context";

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { dict } = useAdminI18n();

  const deleteProduct = async () => {
    const confirmText = `${dict.products.deleteConfirmPrefix} "${name}"? ${dict.products.deleteConfirmSuffix}`;
    if (!window.confirm(confirmText)) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok || !body.ok) {
        setError(body.message ?? dict.products.deleteError);
        setBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setError(dict.common.networkError);
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-red-200 bg-white px-4 text-xs sm:text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
        disabled={busy}
        onClick={deleteProduct}
        type="button"
      >
        <Trash2 size={16} /> {busy ? dict.common.deleting : dict.common.delete}
      </button>
      {error ? <span className="text-xs text-red-700">{error}</span> : null}
    </div>
  );
}
