"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing } from "lucide-react";

function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

  return (
    <p className="inline-flex items-center gap-2 text-xs text-concrete-500">
      <BellRing size={14} />
      Auto-refresh on · {lastCheck ? `checked ${lastCheck.toLocaleTimeString()}` : "watching for new orders"}
    </p>
  );
}
