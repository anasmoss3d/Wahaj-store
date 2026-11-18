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
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md rounded-md border border-concrete-100 bg-white p-8 text-center shadow-soft">
        <h1 className="text-2xl font-bold text-concrete-900">{t.errorTitle}</h1>
        <p className="mt-3 leading-7 text-concrete-600">{t.errorHint}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            className="rounded-md bg-wahaj-teal px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            onClick={() => reset()}
            type="button"
          >
            {t.errorRetry}
          </button>
          <Link
            className="rounded-md border border-concrete-200 px-4 py-2 text-sm font-semibold text-concrete-700 transition hover:bg-concrete-50"
            href="/"
          >
            {t.errorHome}
          </Link>
        </div>
      </div>
    </main>
  );
}
