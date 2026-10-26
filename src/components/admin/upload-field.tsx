"use client";

import Image from "next/image";
import { UploadCloud } from "lucide-react";
import { useState, useTransition } from "react";
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
        const payload = (await response.json()) as { ok: boolean; url?: string; message?: string };
        if (!payload.ok || !payload.url) {
          setMessage(payload.message ?? "Upload failed.");
          return;
        }
        onChange(payload.url);
        setPreviewFailed(false);
        setMessage("Uploaded. Save this form to apply the image.");
      } catch {
        setMessage("Upload failed. Please try again.");
      }
    });
  }

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium text-concrete-800">{label}</span>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Input
          onChange={(event) => {
            setPreviewFailed(false);
            onChange(event.target.value);
          }}
          value={value}
        />
        <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-concrete-900 px-4 py-2 text-sm font-semibold text-white">
          <UploadCloud size={18} />
          {pending ? "Uploading..." : "Upload"}
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
        <div className="relative mt-1 h-36 w-36 overflow-hidden rounded-md border border-concrete-200 bg-concrete-50">
          <Image
            alt={`${label} preview`}
            className="object-contain"
            fill
            sizes="144px"
            src={value}
            unoptimized
            onError={() => {
              setPreviewFailed(true);
              setMessage("The image URL could not be previewed.");
            }}
          />
        </div>
      ) : null}
      {message ? <span className="text-xs text-concrete-500">{message}</span> : null}
    </div>
  );
}
