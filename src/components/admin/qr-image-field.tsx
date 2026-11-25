"use client";

import Image from "next/image";
import { useState } from "react";
import { useAdminI18n } from "@/components/admin/admin-i18n-context";
import { UploadField } from "@/components/admin/upload-field";

export function QrImageField({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const { dict } = useAdminI18n();

  return (
    <div className="grid gap-3">
      <input name="instapayQrImage" type="hidden" value={value} />
      <UploadField label={dict.settings.instapayQrImage} onChange={setValue} value={value} />
      {value ? (
        <Image
          alt={dict.settings.instapayQrPreviewAlt}
          className="h-32 w-32 rounded-2xl border border-[#E5DDD0] bg-white object-contain p-1"
          height={128}
          src={value}
          width={128}
        />
      ) : null}
    </div>
  );
}
