"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpLeft, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DailySeriesPoint {
  key: string;
  label: string;
  cents: number;
  orders: number;
}

export interface StatusSegment {
  key: string;
  label: string;
  count: number;
  color: string;
}

export interface CategoryDistributionRow {
  id: string;
  name: string;
  slug: string;
  activeCount: number;
  archivedCount: number;
}

export interface ActiveStockRow {
  id: string;
  name: string;
  stockQuantity: number;
  basePrice: number;
}

function formatCurrency(amount: number, locale: "ar" | "en") {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0
  }).format(amount);
}

export function SalesTrendChart({
  title,
  days,
  rangeRevenueCents,
  rangeOrders,
  averageOrderValue,
  locale,
  labels
}: {
  title: string;
  days: DailySeriesPoint[];
  rangeRevenueCents: number;
  rangeOrders: number;
  averageOrderValue: number;
  locale: "ar" | "en";
  labels: {
    ordersUnit: string;
    aovLabel: string;
    metricRevenue: string;
    metricOrders: string;
    peakDay: string;
    emptyTrendNote: string;
  };
}) {
  const [metric, setMetric] = useState<"revenue" | "orders">("revenue");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const values = useMemo(
    () => days.map((d) => (metric === "revenue" ? Math.round(d.cents / 100) : d.orders)),
    [days, metric]
  );

  const rawMax = Math.max(0, ...values);
  const scaleMax = rawMax > 0 ? Math.ceil(rawMax * 1.15) : metric === "revenue" ? 1000 : 10;
  const peakIdx = rawMax > 0 ? values.indexOf(rawMax) : -1;
  const activeIdx = hoveredIdx ?? (peakIdx >= 0 ? peakIdx : null);
  const activeDay = activeIdx !== null ? days[activeIdx] : null;

  const width = 680;
  const height = 210;
  const padLeft = 48;
  const padRight = 14;
  const padTop = 16;
  const padBottom = 26;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const baselineY = padTop + plotH;

  const points = days.map((day, idx) => {
    const val = values[idx] ?? 0;
    const step = days.length > 1 ? plotW / (days.length - 1) : plotW / 2;
    const x = days.length === 1 ? padLeft + plotW / 2 : padLeft + idx * step;
    const y = baselineY - (val / scaleMax) * plotH;
    return { x, y, val, day, idx };
  });

  const linePath =
    points.length > 1 && rawMax > 0
      ? points
          .map((pt, i) => `${i === 0 ? "M" : "L"}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`)
          .join(" ")
      : "";
  const areaPath =
    linePath && points.length > 1
      ? `${linePath} L${points[points.length - 1].x.toFixed(1)},${baselineY} L${points[0].x.toFixed(1)},${baselineY} Z`
      : "";

  const colW = Math.max(4, Math.min(18, plotW / Math.max(days.length, 1) - 3));
  const yTicks = [0, Math.round(scaleMax / 2), scaleMax];
  const xTickIndices =
    days.length <= 2
      ? days.map((_, i) => i)
      : [0, Math.floor((days.length - 1) / 2), days.length - 1];

  return (
    <div className="min-w-0 rounded-2xl border border-[#E5DDD0] bg-white p-5 sm:p-6 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-editorial text-xl font-bold text-[#1C1917] sm:text-2xl">{title}</h2>
          <p className="mt-1 text-xs sm:text-sm text-[#78716C] font-light">
            {formatCurrency(rangeRevenueCents / 100, locale)} · {rangeOrders} {labels.ordersUnit} ·{" "}
            {labels.aovLabel} {formatCurrency(averageOrderValue, locale)}
          </p>
        </div>
        <div
          className="inline-flex rounded-full border border-[#E5DDD0] bg-[#FAF8F5] p-1"
          role="group"
        >
          <button
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
              metric === "revenue"
                ? "bg-[#1C1917] text-white shadow-sm"
                : "text-[#665E57] hover:text-[#1C1917]"
            )}
            onClick={() => setMetric("revenue")}
            type="button"
          >
            {labels.metricRevenue}
          </button>
          <button
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
              metric === "orders"
                ? "bg-[#1C1917] text-white shadow-sm"
                : "text-[#665E57] hover:text-[#1C1917]"
            )}
            onClick={() => setMetric("orders")}
            type="button"
          >
            {labels.metricOrders}
          </button>
        </div>
      </div>

      <div className="mt-3 min-h-[28px] flex flex-wrap items-center justify-between gap-2 text-xs">
        {activeDay ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E5DDD0] bg-[#FAF8F5] px-3 py-1 text-[#1C1917]">
            <span className="font-mono text-[#78716C]" dir="ltr">
              {activeDay.key}
            </span>
            <span className="font-bold text-[#B85A2D]">
              {metric === "revenue"
                ? formatCurrency(activeDay.cents / 100, locale)
                : `${activeDay.orders} ${labels.ordersUnit}`}
            </span>
            {peakIdx >= 0 && activeIdx === peakIdx ? (
              <span className="rounded-full bg-[#B85A2D]/10 px-2 py-0.5 text-[11px] font-medium text-[#B85A2D]">
                {labels.peakDay}
              </span>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-[#8C827A] font-light">{labels.emptyTrendNote}</p>
        )}
      </div>

      <div className="mt-2 w-full overflow-hidden" dir="ltr">
        <svg
          aria-label={title}
          className="h-auto w-full select-none"
          viewBox={`0 0 ${width} ${height}`}
        >
          <defs>
            <linearGradient id="wahajAreaGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#B85A2D" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#B85A2D" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {yTicks.map((tick) => {
            const y = baselineY - (tick / scaleMax) * plotH;
            return (
              <g key={tick}>
                <line
                  stroke={tick === 0 ? "#D6CEC2" : "#EDE8E0"}
                  strokeDasharray={tick === 0 ? undefined : "4 4"}
                  strokeWidth={1}
                  x1={padLeft}
                  x2={width - padRight}
                  y1={y}
                  y2={y}
                />
                <text
                  fill="#8C827A"
                  fontSize="10"
                  textAnchor="end"
                  x={padLeft - 8}
                  y={y + 3.5}
                >
                  {metric === "revenue" && tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
                </text>
              </g>
            );
          })}

          {areaPath ? <path d={areaPath} fill="url(#wahajAreaGrad)" /> : null}

          {points.map((pt) => {
            const barH = pt.val > 0 ? Math.max(4, (pt.val / scaleMax) * plotH) : 3;
            const barY = baselineY - barH;
            const isHovered = activeIdx === pt.idx;
            return (
              <g
                className="cursor-pointer"
                key={pt.day.key}
                onClick={() => setHoveredIdx(pt.idx)}
                onMouseEnter={() => setHoveredIdx(pt.idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <rect
                  fill="transparent"
                  height={plotH + 12}
                  width={Math.max(10, plotW / Math.max(days.length, 1))}
                  x={pt.x - Math.max(10, plotW / Math.max(days.length, 1)) / 2}
                  y={padTop}
                />
                <rect
                  className="transition-all duration-300"
                  fill={
                    pt.val > 0
                      ? isHovered
                        ? "#9E4A22"
                        : "#B85A2D"
                      : isHovered
                        ? "#D6CEC2"
                        : "#EDE8E0"
                  }
                  height={barH}
                  rx={3}
                  width={colW}
                  x={pt.x - colW / 2}
                  y={barY}
                />
              </g>
            );
          })}

          {linePath ? (
            <path
              d={linePath}
              fill="none"
              stroke="#1C1917"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
            />
          ) : null}

          {rawMax > 0
            ? points
                .filter((pt) => pt.val > 0)
                .map((pt) => (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    fill={activeIdx === pt.idx ? "#B85A2D" : "#FFFFFF"}
                    key={`dot-${pt.day.key}`}
                    r={activeIdx === pt.idx ? 4.5 : 3}
                    stroke="#1C1917"
                    strokeWidth={1.5}
                  />
                ))
            : null}

          {xTickIndices.map((idx) => {
            const pt = points[idx];
            if (!pt) return null;
            const anchor = idx === 0 ? "start" : idx === days.length - 1 ? "end" : "middle";
            return (
              <text
                fill="#8C827A"
                fontSize="10"
                key={`xt-${pt.day.key}`}
                textAnchor={anchor}
                x={pt.x}
                y={height - 6}
              >
                {pt.day.key.slice(5)}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export function StatusDonutChart({
  title,
  subtitle,
  segments,
  total,
  totalLabel,
  emptyLabel,
  manageLabel,
  isArabic
}: {
  title: string;
  subtitle: string;
  segments: StatusSegment[];
  total: number;
  totalLabel: string;
  emptyLabel: string;
  manageLabel: string;
  isArabic: boolean;
}) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;

  const arcMeta = segments.reduce<{
    offset: number;
    items: Array<StatusSegment & { pct: number; dashLen: number; dashOffset: number }>;
  }>(
    (acc, seg) => {
      const pct = total > 0 ? Math.round((seg.count / total) * 100) : 0;
      const dashLen = total > 0 ? (seg.count / total) * circumference : 0;
      const item = { ...seg, pct, dashLen, dashOffset: -acc.offset };
      return {
        offset: acc.offset + dashLen,
        items: [...acc.items, item]
      };
    },
    { offset: 0, items: [] }
  ).items;

  return (
    <div className="min-w-0 rounded-2xl border border-[#E5DDD0] bg-white p-5 sm:p-6 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-editorial text-xl font-bold text-[#1C1917] sm:text-2xl">{title}</h2>
          <p className="mt-1 text-xs sm:text-sm text-[#78716C] font-light">{subtitle}</p>
        </div>
        <Link
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#E5DDD0] bg-[#FAF8F5] px-3 py-1.5 text-xs font-medium text-[#1C1917] transition-colors hover:border-[#B85A2D] hover:text-[#B85A2D]"
          href="/admin/orders"
        >
          <span>{manageLabel}</span>
          {isArabic ? <ArrowUpLeft size={13} aria-hidden /> : <ArrowUpRight size={13} aria-hidden />}
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-1 items-center gap-5 sm:grid-cols-[148px_1fr]">
        <div className="relative mx-auto flex h-36 w-36 items-center justify-center">
          <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" fill="none" r={radius} stroke="#EDE8E0" strokeWidth="14" />
            {total > 0
              ? arcMeta.map((seg) =>
                  seg.dashLen > 0 ? (
                    <circle
                      cx="60"
                      cy="60"
                      fill="none"
                      key={seg.key}
                      r={radius}
                      stroke={seg.color}
                      strokeDasharray={`${seg.dashLen} ${circumference}`}
                      strokeDashoffset={seg.dashOffset}
                      strokeLinecap="butt"
                      strokeWidth="14"
                    />
                  ) : null
                )
              : null}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-editorial text-2xl font-black text-[#1C1917] leading-none">
              {total}
            </span>
            <span className="mt-1 text-[11px] font-medium text-[#78716C]">{totalLabel}</span>
          </div>
        </div>

        <div className="grid min-w-0 gap-2.5">
          {arcMeta.map((seg) => (
            <div className="grid gap-1" key={seg.key}>
              <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                <span className="inline-flex min-w-0 items-center gap-2 font-medium text-[#1C1917]">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="truncate">{seg.label}</span>
                </span>
                <span className="shrink-0 font-mono text-xs text-[#665E57]" dir="ltr">
                  {seg.count} ({seg.pct}%)
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EDE8E0]">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${total > 0 ? Math.max(seg.count > 0 ? 4 : 0, seg.pct) : 0}%`,
                    backgroundColor: seg.color
                  }}
                />
              </div>
            </div>
          ))}
          {total === 0 ? (
            <p className="pt-1 text-xs text-[#8C827A] font-light">{emptyLabel}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function CatalogInventoryChart({
  title,
  subtitle,
  categories,
  activeProductsList,
  avgActivePrice,
  locale,
  isArabic,
  labels
}: {
  title: string;
  subtitle: string;
  categories: CategoryDistributionRow[];
  activeProductsList: ActiveStockRow[];
  avgActivePrice: number;
  locale: "ar" | "en";
  isArabic: boolean;
  labels: {
    byCategoryHeading: string;
    activeStockHeading: string;
    activeUnit: string;
    archivedUnit: string;
    units: string;
    avgPrice: string;
    openProductsLink: string;
    emptyCategoryProducts: string;
  };
}) {
  const maxCategoryTotal = Math.max(
    1,
    ...categories.map((c) => c.activeCount + c.archivedCount)
  );
  const maxStock = Math.max(1, ...activeProductsList.map((p) => p.stockQuantity));

  return (
    <div className="min-w-0 rounded-2xl border border-[#E5DDD0] bg-white p-5 sm:p-6 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-editorial text-xl font-bold text-[#1C1917] sm:text-2xl">{title}</h2>
          <p className="mt-1 text-xs sm:text-sm text-[#78716C] font-light">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[#E5DDD0] bg-[#FAF8F5] px-3 py-1.5 text-xs font-medium text-[#665E57]">
            {labels.avgPrice}:{" "}
            <strong className="font-bold text-[#1C1917]">
              {formatCurrency(avgActivePrice, locale)}
            </strong>
          </span>
          <Link
            className="inline-flex items-center gap-1 rounded-full border border-[#E5DDD0] bg-[#FAF8F5] px-3 py-1.5 text-xs font-medium text-[#1C1917] transition-colors hover:border-[#B85A2D] hover:text-[#B85A2D]"
            href="/admin/products"
          >
            <span>{labels.openProductsLink}</span>
            {isArabic ? (
              <ArrowUpLeft size={13} aria-hidden />
            ) : (
              <ArrowUpRight size={13} aria-hidden />
            )}
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-[#EDE8E0] bg-[#FAF8F5] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[#1C1917]">{labels.byCategoryHeading}</p>
            <div className="flex items-center gap-3 text-xs text-[#665E57]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#B85A2D]" />
                {labels.activeUnit}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#C9BFA9]" />
                {labels.archivedUnit}
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {categories.map((cat) => {
              const total = cat.activeCount + cat.archivedCount;
              const activePct = (cat.activeCount / maxCategoryTotal) * 100;
              const archivedPct = (cat.archivedCount / maxCategoryTotal) * 100;
              return (
                <div className="grid gap-1.5" key={cat.id}>
                  <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                    <span className="truncate font-medium text-[#1C1917]">{cat.name}</span>
                    <span className="shrink-0 font-mono text-xs text-[#665E57]" dir="ltr">
                      {total === 0
                        ? labels.emptyCategoryProducts
                        : `${cat.activeCount} / ${total}`}
                    </span>
                  </div>
                  <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[#EDE8E0]">
                    {activePct > 0 ? (
                      <div
                        className="h-full bg-[#B85A2D] transition-all duration-500"
                        style={{ width: `${activePct}%` }}
                      />
                    ) : null}
                    {archivedPct > 0 ? (
                      <div
                        className="h-full bg-[#C9BFA9] transition-all duration-500"
                        style={{ width: `${archivedPct}%` }}
                      />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="min-w-0 rounded-2xl border border-[#EDE8E0] bg-[#FAF8F5] p-4 sm:p-5">
          <p className="text-sm font-semibold text-[#1C1917]">{labels.activeStockHeading}</p>
          <div className="mt-4 grid gap-3">
            {activeProductsList.map((prod) => {
              const pct = Math.max(8, (prod.stockQuantity / maxStock) * 100);
              const barColor =
                prod.stockQuantity <= 5
                  ? "#B85A2D"
                  : prod.stockQuantity <= 12
                    ? "#C7924D"
                    : "#5E6D61";
              return (
                <Link
                  className="group grid gap-1.5 rounded-xl border border-[#E5DDD0]/80 bg-white px-3.5 py-2.5 transition-colors hover:border-[#B85A2D]"
                  href={`/admin/products/${prod.id}`}
                  key={prod.id}
                >
                  <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                    <span className="truncate font-semibold text-[#1C1917] group-hover:text-[#B85A2D]">
                      {prod.name}
                    </span>
                    <span className="shrink-0 text-xs text-[#665E57]">
                      {formatCurrency(prod.basePrice, locale)} ·{" "}
                      <strong className="text-[#1C1917]">
                        {prod.stockQuantity} {labels.units}
                      </strong>
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#EDE8E0]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: barColor }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
