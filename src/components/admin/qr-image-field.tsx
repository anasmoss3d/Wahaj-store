"use client";

import Image from "next/image";
import { useState } from "react";
import { UploadField } from "@/components/admin/upload-field";

export function QrImageField({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  return (
    <div className="grid gap-3">
      <input name="instapayQrImage" type="hidden" value={value} />
      <UploadField label="InstaPay QR image" onChange={setValue} value={value} />
      {value ? (
        <Image
          alt="InstaPay QR preview"
          className="h-32 w-32 rounded-md border border-concrete-200 bg-white object-contain"
          height={128}
          src={value}
          width={128}
        />
      ) : null}
    </div>
  );
}
