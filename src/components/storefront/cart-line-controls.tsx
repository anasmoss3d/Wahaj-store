"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2 } from "lucide-react";

export function CartLineControls({ itemId, quantity }: { itemId: string; quantity: number }) {
  const router = useRouter();
  const [current, setCurrent] = useState(quantity);
  const [pending, startTransition] = useTransition();

  function update(next: number) {
    const safe = Math.max(1, Math.min(99, next));
    setCurrent(safe);
    startTransition(async () => {
      await fetch(`/api/cart/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: safe })
      });
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      await fetch(`/api/cart/items/${itemId}`, { method: "DELETE" });
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      <div className="inline-flex h-10 items-center rounded-md border border-concrete-200">
        <button
          aria-label="Decrease quantity"
          className="grid h-10 w-10 place-items-center disabled:opacity-50"
          disabled={pending}
          onClick={() => update(current - 1)}
          type="button"
        >
          <Minus size={16} />
        </button>
        <span className="w-10 text-center text-sm font-semibold">{current}</span>
        <button
          aria-label="Increase quantity"
          className="grid h-10 w-10 place-items-center disabled:opacity-50"
          disabled={pending}
          onClick={() => update(current + 1)}
          type="button"
        >
          <Plus size={16} />
        </button>
      </div>
      <button
        aria-label="Remove item"
        className="grid h-10 w-10 place-items-center rounded-md text-red-600 hover:bg-red-50"
        disabled={pending}
        onClick={remove}
        type="button"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
