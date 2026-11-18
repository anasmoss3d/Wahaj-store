"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteProduct = async () => {
    if (!window.confirm(`Delete "${name}"? This removes it from the store for good.`)) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok || !body.ok) {
        setError(body.message ?? "Could not delete product.");
        setBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error — please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        className="inline-flex min-h-10 items-center gap-2 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
        disabled={busy}
        onClick={deleteProduct}
        type="button"
      >
        <Trash2 size={16} /> {busy ? "Deleting…" : "Delete"}
      </button>
      {error ? <span className="text-xs text-red-700">{error}</span> : null}
    </div>
  );
}
