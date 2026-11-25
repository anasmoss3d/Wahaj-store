"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { ActionState } from "@/app/actions/auth";
import { useAdminI18n } from "@/components/admin/admin-i18n-context";

export function DeleteButton({
  action,
  id,
  label
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  id: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { dict } = useAdminI18n();

  return (
    <button
      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-red-200 bg-white px-4 text-xs sm:text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(dict.common.confirmDelete)) return;
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
      <Trash2 size={16} /> {label ?? dict.common.delete}
    </button>
  );
}
