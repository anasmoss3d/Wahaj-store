"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "@/lib/translations";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();
  useEffect(() => {
    // Log the error for later review (never shown to the customer).
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#F7F4EE] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-[#E5DDD0] bg-white p-8 sm:p-10 text-center shadow-[0_18px_50px_-15px_rgba(28,25,23,0.1)]">
        <h1 className="font-editorial text-3xl font-black text-[#1C1917]">{t.errorTitle}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#665E57] font-light">{t.errorHint}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            className="rounded-full bg-[#B85A2D] px-6 py-3 text-sm font-medium text-white shadow-pill transition-all duration-300 hover:bg-[#9E4A22] active:scale-[0.98]"
            onClick={() => reset()}
            type="button"
          >
            {t.errorRetry}
          </button>
          <Link
            className="rounded-full border border-[#DED7CB] bg-[#F4EFEB] px-6 py-3 text-sm font-medium text-[#1C1917] transition-all duration-300 hover:bg-[#EAE4DC]"
            href="/"
          >
            {t.errorHome}
          </Link>
        </div>
      </div>
    </main>
  );
}
