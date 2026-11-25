"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing } from "lucide-react";
import { useAdminI18n } from "@/components/admin/admin-i18n-context";

function beep() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.15);
    });
    setTimeout(() => void ctx.close(), 800);
  } catch {
    // Audio may be blocked before user interaction; refresh still happens.
  }
}

export function OrdersAutoRefresh({ initialLatestAt }: { initialLatestAt: string | null }) {
  const router = useRouter();
  const latestRef = useRef(initialLatestAt);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const { locale, dict } = useAdminI18n();

  useEffect(() => {
    latestRef.current = initialLatestAt;
  }, [initialLatestAt]);

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const response = await fetch("/api/admin/orders/latest", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { ok: boolean; latestAt: string | null };
        setLastCheck(new Date());
        if (payload.ok && payload.latestAt && payload.latestAt !== latestRef.current) {
          latestRef.current = payload.latestAt;
          beep();
          router.refresh();
        }
      } catch {
        // Network hiccup: try again on the next tick.
      }
    }, 15000);
    return () => clearInterval(id);
  }, [router]);

  const timeString = lastCheck
    ? lastCheck.toLocaleTimeString(locale === "ar" ? "ar-EG-u-nu-latn" : "en-EG")
    : null;

  return (
    <p className="inline-flex items-center gap-2 rounded-full border border-[#CBD5C8] bg-[#E7ECE5]/80 px-3.5 py-1.5 text-xs font-medium text-[#2F463B]">
      <BellRing size={13} className="text-[#B85A2D]" />
      <span>
        {dict.orders.autoRefreshPrefix}{" "}
        {timeString
          ? `${dict.orders.autoRefreshChecked} ${timeString}`
          : dict.orders.autoRefreshWatching}
      </span>
    </p>
  );
}
