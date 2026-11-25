"use client";

import Image from "next/image";
import { UploadCloud } from "lucide-react";
import { useState, useTransition } from "react";
import { useAdminI18n } from "@/components/admin/admin-i18n-context";
import { Input } from "@/components/ui/input";

export function UploadField({
  value,
  onChange,
  label
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  const [message, setMessage] = useState("");
  const [previewFailed, setPreviewFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const { dict } = useAdminI18n();

  function upload(file: File | null) {
    if (!file) return;
    setMessage("");
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/admin/media", {
          method: "POST",
          body: formData
        });
        const payload = (await response.json()) as {
          ok: boolean;
          url?: string;
          message?: string;
        };
        if (!payload.ok || !payload.url) {
          setMessage(payload.message ?? dict.common.uploadFailed);
          return;
        }
        onChange(payload.url);
        setPreviewFailed(false);
        setMessage(dict.common.uploadSuccess);
      } catch {
        setMessage(dict.common.uploadFailed);
      }
    });
  }

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium text-[#1C1917]">{label}</span>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Input
          dir="ltr"
          onChange={(event) => {
            setPreviewFailed(false);
            onChange(event.target.value);
          }}
          value={value}
        />
        <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#1C1917] px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#B85A2D]">
          <UploadCloud size={17} />
          {pending ? dict.common.uploading : dict.common.upload}
          <input
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            disabled={pending}
            onChange={(event) => {
              upload(event.target.files?.[0] ?? null);
              event.currentTarget.value = "";
            }}
            type="file"
          />
        </label>
      </div>
      {value && !previewFailed ? (
        <div className="relative mt-1 h-36 w-36 overflow-hidden rounded-2xl border border-[#E5DDD0] bg-[#FAF8F5] p-1">
          <Image
            alt={`${label} preview`}
            className="object-contain"
            fill
            sizes="144px"
            src={value}
            unoptimized
            onError={() => {
              setPreviewFailed(true);
              setMessage(dict.common.previewFailed);
            }}
          />
        </div>
      ) : null}
      {message ? <span className="text-xs text-[#78716C]">{message}</span> : null}
    </div>
  );
}
