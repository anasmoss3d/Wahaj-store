"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { ActionState } from "@/app/actions/auth";

export function DeleteButton({
  action,
  id,
  label = "Delete"
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  id: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="inline-flex min-h-10 items-center gap-2 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Delete this item? This cannot be undone.")) return;
        startTransition(async () => {
          const formData = new FormData();
          formData.set("id", id);
          const result = await action({}, formData);
          if (result.error) window.alert(result.error);
          router.refresh();
        });
      }}
      type="button"
    >
      <Trash2 size={16} /> {label}
    </button>
  );
}
