"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2 } from "lucide-react";

export function CartLineControls({
  itemId,
  quantity,
  labels = { decrease: "Decrease quantity", increase: "Increase quantity", remove: "Remove item" }
}: {
  itemId: string;
  quantity: number;
  labels?: { decrease: string; increase: string; remove: string };
}) {
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
    <div className="flex items-center gap-2.5">
      <div className="inline-flex h-10 items-center rounded-full border border-[#DED7CB] bg-[#FAF8F5] p-0.5">
        <button
          aria-label={labels.decrease}
          className="grid h-9 w-9 place-items-center rounded-full text-[#1C1917] transition hover:bg-[#EDE7DD] disabled:opacity-50"
          disabled={pending}
          onClick={() => update(current - 1)}
          type="button"
        >
          <Minus size={15} />
        </button>
        <span className="w-9 text-center text-sm font-semibold text-[#1C1917]">{current}</span>
        <button
          aria-label={labels.increase}
          className="grid h-9 w-9 place-items-center rounded-full text-[#1C1917] transition hover:bg-[#EDE7DD] disabled:opacity-50"
          disabled={pending}
          onClick={() => update(current + 1)}
          type="button"
        >
          <Plus size={15} />
        </button>
      </div>
      <button
        aria-label={labels.remove}
        className="grid h-10 w-10 place-items-center rounded-full border border-transparent text-[#8C827A] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        disabled={pending}
        onClick={remove}
        type="button"
      >
        <Trash2 size={17} />
      </button>
    </div>
  );
}
