import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface KpiCardItem {
  key: string;
  label: string;
  value: string | number;
  detail?: ReactNode;
  icon?: ReactNode;
  tone?: "terracotta" | "gold" | "sage" | "charcoal";
  href?: string;
}

const TONE_MAP = {
  terracotta: "bg-[#B85A2D]/10 text-[#B85A2D]",
  gold: "bg-[#C7924D]/15 text-[#9A6B2E]",
  sage: "bg-[#E7ECE5] text-[#2F463B]",
  charcoal: "border border-[#E5DDD0] bg-[#FAF8F5] text-[#1C1917]"
} as const;

export function KpiGrid({
  items,
  columns = 4
}: {
  items: KpiCardItem[];
  columns?: 3 | 4;
}) {
  return (
    <section
      className={cn(
        "mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2",
        columns === 4 ? "xl:grid-cols-4" : "lg:grid-cols-3"
      )}
    >
      {items.map((item) => {
        const inner = (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-[#78716C]">{item.label}</span>
              {item.icon ? (
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    TONE_MAP[item.tone ?? "charcoal"]
                  )}
                >
                  {item.icon}
                </span>
              ) : null}
            </div>
            <p className="mt-2 font-editorial text-2xl sm:text-3xl font-black text-[#1C1917]">
              {typeof item.value === "string" && /^[\d.,\s/–-]+$/.test(item.value.trim()) ? (
                <span className="inline-block" dir="ltr">
                  {item.value}
                </span>
              ) : (
                item.value
              )}
            </p>
            {item.detail ? (
              <div className="mt-1.5 text-xs text-[#78716C] font-light">{item.detail}</div>
            ) : null}
          </>
        );

        const baseClass =
          "min-w-0 rounded-2xl border border-[#E5DDD0] bg-white p-4 sm:p-5 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]";

        return item.href ? (
          <Link
            className={cn(
              baseClass,
              "group transition-colors hover:border-[#B85A2D]"
            )}
            href={item.href}
            key={item.key}
          >
            {inner}
          </Link>
        ) : (
          <div className={baseClass} key={item.key}>
            {inner}
          </div>
        );
      })}
    </section>
  );
}

export interface ShareSegment {
  key: string;
  label: string;
  count: number;
  color: string;
  href?: string;
}

export function SegmentedShareCard({
  title,
  segments,
  total,
  emptyLabel
}: {
  title: string;
  segments: ShareSegment[];
  total: number;
  emptyLabel?: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-[#E5DDD0] bg-white p-5 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-editorial text-lg font-bold text-[#1C1917]">{title}</h2>
        <span className="font-mono text-xs text-[#78716C]" dir="ltr">
          {total}
        </span>
      </div>

      <div className="mt-3.5 flex h-3 w-full overflow-hidden rounded-full bg-[#EDE8E0]">
        {total > 0
          ? segments.map((seg) => {
              const pct = (seg.count / total) * 100;
              return pct > 0 ? (
                <div
                  className="h-full transition-all duration-500"
                  key={seg.key}
                  style={{ width: `${pct}%`, backgroundColor: seg.color }}
                  title={`${seg.label}: ${seg.count}`}
                />
              ) : null;
            })
          : null}
      </div>

      <div className="mt-3.5 flex flex-wrap gap-2">
        {segments.map((seg) => {
          const pct = total > 0 ? Math.round((seg.count / total) * 100) : 0;
          const badge = (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EDE8E0] bg-[#FAF8F5] px-2.5 py-1 text-xs text-[#1C1917]">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: seg.color }}
              />
              <span>{seg.label}</span>
              <span className="font-mono text-[11px] text-[#78716C]" dir="ltr">
                {seg.count} ({pct}%)
              </span>
            </span>
          );
          return seg.href ? (
            <Link
              className="transition-opacity hover:opacity-80"
              href={seg.href}
              key={seg.key}
            >
              {badge}
            </Link>
          ) : (
            <span key={seg.key}>{badge}</span>
          );
        })}
      </div>

      {total === 0 && emptyLabel ? (
        <p className="mt-2.5 text-xs text-[#8C827A] font-light">{emptyLabel}</p>
      ) : null}
    </div>
  );
}

export interface BarChartRow {
  key: string;
  label: string;
  sublabel?: string;
  value: number;
  secondaryValue?: number;
  displayValue: string;
  color?: string;
  secondaryColor?: string;
  swatch?: string;
  href?: string;
}

export function HorizontalBarCard({
  title,
  subtitle,
  rows,
  maxOverride,
  legend,
  emptyLabel
}: {
  title: string;
  subtitle?: string;
  rows: BarChartRow[];
  maxOverride?: number;
  legend?: Array<{ label: string; color: string }>;
  emptyLabel?: string;
}) {
  const maxValue = Math.max(
    1,
    maxOverride ?? 0,
    ...rows.map((r) => r.value + (r.secondaryValue ?? 0))
  );

  return (
    <div className="min-w-0 rounded-2xl border border-[#E5DDD0] bg-white p-5 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-editorial text-lg font-bold text-[#1C1917] sm:text-xl">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-[#78716C] font-light">{subtitle}</p>
          ) : null}
        </div>
        {legend && legend.length > 0 ? (
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#665E57]">
            {legend.map((item) => (
              <span className="inline-flex items-center gap-1.5" key={item.label}>
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <p className="mt-3 text-xs text-[#78716C] font-light">{emptyLabel}</p>
      ) : (
        <div className="mt-4 grid gap-3">
          {rows.map((row) => {
            const primaryPct = Math.min(100, (row.value / maxValue) * 100);
            const secondaryPct = row.secondaryValue
              ? Math.min(100 - primaryPct, (row.secondaryValue / maxValue) * 100)
              : 0;

            const content = (
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                  <span className="inline-flex min-w-0 items-center gap-2">
                    {row.swatch ? (
                      <span
                        className="h-3.5 w-3.5 shrink-0 rounded-full border border-[#DED7CB]"
                        style={{ backgroundColor: row.swatch }}
                      />
                    ) : null}
                    <span className="truncate font-medium text-[#1C1917]">{row.label}</span>
                    {row.sublabel ? (
                      <span className="hidden truncate text-xs text-[#8C827A] sm:inline">
                        · {row.sublabel}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 font-mono text-xs font-semibold text-[#1C1917]" dir="ltr">
                    {row.displayValue}
                  </span>
                </div>
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[#EDE8E0]">
                  {primaryPct > 0 ? (
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${Math.max(4, primaryPct)}%`,
                        backgroundColor: row.color ?? "#B85A2D"
                      }}
                    />
                  ) : null}
                  {secondaryPct > 0 ? (
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${Math.max(4, secondaryPct)}%`,
                        backgroundColor: row.secondaryColor ?? "#C9BFA9"
                      }}
                    />
                  ) : null}
                </div>
              </div>
            );

            return row.href ? (
              <Link
                className="block rounded-xl px-2 py-1 transition-colors hover:bg-[#FAF8F5]"
                href={row.href}
                key={row.key}
              >
                {content}
              </Link>
            ) : (
              <div key={row.key}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function MiniDailyVolumeChart({
  title,
  days,
  emptyLabel
}: {
  title: string;
  days: Array<{ key: string; count: number; cents: number }>;
  emptyLabel: string;
}) {
  const maxCount = Math.max(1, ...days.map((d) => d.count));
  const hasAny = days.some((d) => d.count > 0);
  const width = 420;
  const height = 104;
  const padX = 8;
  const padTop = 10;
  const padBottom = 20;
  const plotH = height - padTop - padBottom;
  const baselineY = padTop + plotH;
  const step = (width - padX * 2) / Math.max(days.length, 1);
  const barW = Math.max(8, Math.min(18, step - 4));

  return (
    <div className="min-w-0 rounded-2xl border border-[#E5DDD0] bg-white p-5 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-editorial text-lg font-bold text-[#1C1917]">{title}</h2>
        {days.length > 0 ? (
          <span className="font-mono text-[11px] text-[#8C827A]" dir="ltr">
            {days[0].key.slice(5)} → {days[days.length - 1].key.slice(5)}
          </span>
        ) : null}
      </div>

      <div className="mt-2 w-full" dir="ltr">
        <svg aria-label={title} className="h-auto w-full" viewBox={`0 0 ${width} ${height}`}>
          <line
            stroke="#D6CEC2"
            strokeWidth={1}
            x1={padX}
            x2={width - padX}
            y1={baselineY}
            y2={baselineY}
          />
          {days.map((day, idx) => {
            const x = padX + idx * step + (step - barW) / 2;
            const barH = day.count > 0 ? Math.max(6, (day.count / maxCount) * plotH) : 4;
            const y = baselineY - barH;
            return (
              <g key={day.key}>
                <title>{`${day.key}: ${day.count}`}</title>
                <rect
                  fill={day.count > 0 ? "#B85A2D" : "#EDE8E0"}
                  height={barH}
                  rx={3}
                  width={barW}
                  x={x}
                  y={y}
                />
                {idx === 0 || idx === days.length - 1 ? (
                  <text
                    fill="#8C827A"
                    fontSize="9.5"
                    textAnchor={idx === 0 ? "start" : "end"}
                    x={idx === 0 ? x : x + barW}
                    y={height - 4}
                  >
                    {day.key.slice(5)}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>

      {!hasAny ? (
        <p className="mt-1 text-xs text-[#8C827A] font-light">{emptyLabel}</p>
      ) : null}
    </div>
  );
}
