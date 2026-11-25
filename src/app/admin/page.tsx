import Link from "next/link";
import { PackageCheck, ShoppingBag, Sparkles, TrendingUp } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  CatalogInventoryChart,
  SalesTrendChart,
  StatusDonutChart
} from "@/components/admin/overview-charts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cairoDayEnd, cairoDayKey, cairoDayStart, nextCairoDayKey } from "@/lib/datetime";
import { pickLocalized } from "@/lib/dictionary";
import {
  getAdminDictionary,
  getLocale,
  statusLabels,
  type OrderStatusKey
} from "@/lib/i18n";
import { formatMoney, toCents } from "@/lib/money";
import { PERMISSIONS } from "@/lib/rbac";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function validDay(value: string | undefined) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))
    ? value
    : null;
}

const STATUS_META: Array<{ key: OrderStatusKey; color: string }> = [
  { key: "PENDING", color: "#C7924D" },
  { key: "PREPARING", color: "#B85A2D" },
  { key: "SHIPPED", color: "#5E6D61" },
  { key: "DELIVERED", color: "#2F463B" },
  { key: "CANCELLED", color: "#A65D57" }
];

export default async function AdminOverviewPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin(PERMISSIONS.DASHBOARD_READ);
  const [params, locale, dict] = await Promise.all([
    searchParams,
    getLocale(),
    getAdminDictionary()
  ]);
  const isArabic = locale === "ar";
  const ov = dict.overview;

  const now = new Date();
  const todayKey = cairoDayKey(now);
  const default7Key = cairoDayKey(new Date(now.getTime() - 6 * 24 * 3600 * 1000));
  const default30Key = cairoDayKey(new Date(now.getTime() - 29 * 24 * 3600 * 1000));
  const default90Key = cairoDayKey(new Date(now.getTime() - 89 * 24 * 3600 * 1000));
  const fromKey = validDay(one(params.from)) ?? default30Key;
  const toKey = validDay(one(params.to)) ?? todayKey;
  const from = cairoDayStart(fromKey);
  const toEnd = cairoDayEnd(toKey);
  const range = { gte: from, lte: toEnd };

  const [
    allStatusCounts,
    products,
    categories,
    customers,
    activeCoupons,
    pendingReviews,
    activeColorsCount,
    activeAddonsCount,
    revenue,
    statusGroups,
    bestSellers,
    topColors,
    topAddons,
    ordersInRange
  ] = await Promise.all([
    prisma.order.groupBy({
      by: ["status"],
      _count: { status: true }
    }),
    prisma.product.findMany({
      select: {
        id: true,
        name: true,
        nameEn: true,
        active: true,
        stockQuantity: true,
        basePrice: true,
        categoryId: true
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
    }),
    prisma.category.findMany({
      select: { id: true, name: true, nameEn: true, slug: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    }),
    prisma.user.count(),
    prisma.coupon.count({ where: { active: true } }),
    prisma.review.count({ where: { approved: false } }),
    prisma.color.count({ where: { active: true } }),
    prisma.addon.count({ where: { active: true } }),
    prisma.order.aggregate({
      where: { status: { not: "CANCELLED" } },
      _sum: { grandTotal: true }
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { createdAt: range },
      _count: { status: true }
    }),
    prisma.orderItem.groupBy({
      by: ["productId", "productName"],
      where: { order: { createdAt: range, status: { not: "CANCELLED" } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5
    }),
    prisma.orderItem.groupBy({
      by: ["selectedColorName"],
      where: {
        selectedColorName: { not: "" },
        order: { createdAt: range, status: { not: "CANCELLED" } }
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5
    }),
    prisma.orderItemAddon.groupBy({
      by: ["addonName"],
      where: { orderItem: { order: { createdAt: range, status: { not: "CANCELLED" } } } },
      _count: { addonName: true },
      orderBy: { _count: { addonName: "desc" } },
      take: 5
    }),
    prisma.order.findMany({
      where: { createdAt: range },
      select: { createdAt: true, grandTotal: true, status: true }
    })
  ]);

  const statusTotals = new Map(allStatusCounts.map((s) => [s.status, s._count.status]));
  const totalOrders = allStatusCounts.reduce((acc, s) => acc + s._count.status, 0);
  const inProgressOrders =
    (statusTotals.get("PENDING") ?? 0) +
    (statusTotals.get("PREPARING") ?? 0) +
    (statusTotals.get("SHIPPED") ?? 0);
  const deliveredOrders = statusTotals.get("DELIVERED") ?? 0;

  const activeProductsList = products.filter((p) => p.active);
  const archivedCount = products.length - activeProductsList.length;
  const activeStockUnits = activeProductsList.reduce((acc, p) => acc + p.stockQuantity, 0);
  const lowStockCount = activeProductsList.filter((p) => p.stockQuantity <= 5).length;
  const avgActivePrice =
    activeProductsList.length > 0
      ? Math.round(
          activeProductsList.reduce((acc, p) => acc + Number(p.basePrice), 0) /
            activeProductsList.length
        )
      : 0;

  const rangeRevenueCents = ordersInRange
    .filter((order) => order.status !== "CANCELLED")
    .reduce((sum, order) => sum + toCents(order.grandTotal), 0);
  const rangeOrders = ordersInRange.filter((order) => order.status !== "CANCELLED").length;
  const averageOrderCents = rangeOrders > 0 ? Math.round(rangeRevenueCents / rangeOrders) : 0;

  const days: Array<{ key: string; label: string; cents: number; orders: number }> = [];
  let cursorKey = fromKey;
  while (cursorKey <= toKey && days.length < 95) {
    days.push({ key: cursorKey, label: cursorKey.slice(8), cents: 0, orders: 0 });
    cursorKey = nextCairoDayKey(cursorKey);
  }
  const byDay = new Map(days.map((day) => [day.key, day]));
  for (const order of ordersInRange) {
    if (order.status === "CANCELLED") continue;
    const bucket = byDay.get(cairoDayKey(order.createdAt));
    if (bucket) {
      bucket.cents += toCents(order.grandTotal);
      bucket.orders += 1;
    }
  }

  const rangeStatusCounts = new Map(statusGroups.map((row) => [row.status, row._count.status]));
  const rangeTotalStatusOrders = statusGroups.reduce((acc, r) => acc + r._count.status, 0);
  const statusSegments = STATUS_META.map(({ key, color }) => ({
    key,
    label: statusLabels[locale][key] ?? key,
    count: rangeStatusCounts.get(key) ?? 0,
    color
  }));

  const categoryBreakdown = categories.map((cat) => {
    const items = products.filter((p) => p.categoryId === cat.id);
    return {
      id: cat.id,
      slug: cat.slug,
      name: pickLocalized(locale, cat.name, cat.nameEn),
      activeCount: items.filter((p) => p.active).length,
      archivedCount: items.filter((p) => !p.active).length
    };
  });

  const activeStockRows = activeProductsList.map((p) => ({
    id: p.id,
    name: pickLocalized(locale, p.name, p.nameEn),
    stockQuantity: p.stockQuantity,
    basePrice: Number(p.basePrice)
  }));

  const demandColumns = [
    {
      title: ov.bestSellers,
      emptyHint: ov.charts.activeCatalogHint.replace("{count}", String(activeProductsList.length)),
      rows: bestSellers.map((r) => ({
        key: r.productId,
        label: r.productName,
        count: r._sum.quantity ?? 0
      }))
    },
    {
      title: ov.topColors,
      emptyHint: ov.charts.configuredColorsHint.replace("{count}", String(activeColorsCount)),
      rows: topColors.map((r) => ({
        key: r.selectedColorName,
        label: r.selectedColorName,
        count: r._sum.quantity ?? 0
      }))
    },
    {
      title: ov.topAddons,
      emptyHint: ov.charts.configuredAddonsHint.replace("{count}", String(activeAddonsCount)),
      rows: topAddons.map((r) => ({
        key: r.addonName,
        label: r.addonName,
        count: r._count.addonName
      }))
    }
  ];

  const presets = [
    { label: ov.presets.last7, from: default7Key, to: todayKey },
    { label: ov.presets.last30, from: default30Key, to: todayKey },
    { label: ov.presets.last90, from: default90Key, to: todayKey }
  ];

  return (
    <AdminShell>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p
            className={cn(
              "text-[11px] text-[#8C7A6B] font-medium mb-1",
              !isArabic && "uppercase tracking-[0.2em]"
            )}
          >
            {ov.kicker}
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-black text-[#1C1917]">
            {ov.title}
          </h1>
          <p className="mt-1 text-sm text-[#665E57] font-light">{ov.subtitle}</p>
        </div>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="inline-flex w-fit shrink-0 items-center rounded-full border border-[#E5DDD0] bg-white p-1">
            {presets.map((preset) => {
              const active = fromKey === preset.from && toKey === preset.to;
              return (
                <Link
                  className={cn(
                    "whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                    active
                      ? "bg-[#1C1917] text-white"
                      : "text-[#665E57] hover:text-[#1C1917]"
                  )}
                  href={`/admin?from=${preset.from}&to=${preset.to}`}
                  key={preset.from}
                >
                  {preset.label}
                </Link>
              );
            })}
          </div>
          <form className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <Input
              className="h-10 min-h-10 px-3 text-xs sm:text-sm"
              defaultValue={fromKey}
              dir="ltr"
              name="from"
              type="date"
            />
            <Input
              className="h-10 min-h-10 px-3 text-xs sm:text-sm"
              defaultValue={toKey}
              dir="ltr"
              name="to"
              type="date"
            />
            <Button className="col-span-2 h-10 px-5 sm:col-span-1" type="submit">
              {dict.common.filter}
            </Button>
          </form>
        </div>
      </div>

      {/* Compact 4-Card Executive Strip */}
      <section className="mt-7 grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[#E5DDD0] bg-white p-5 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-[#78716C]">{ov.cards.revenueTitle}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#B85A2D]/10 text-[#B85A2D]">
              <TrendingUp size={15} aria-hidden />
            </span>
          </div>
          <p className="mt-2 font-editorial text-2xl sm:text-3xl font-black text-[#1C1917]">
            {formatMoney(revenue._sum.grandTotal ?? "0", "EGP", locale)}
          </p>
          <p className="mt-2 text-xs text-[#78716C] font-light">
            {ov.cards.rangeRevenue}:{" "}
            <strong className="font-semibold text-[#1C1917]">
              {formatMoney(String(rangeRevenueCents / 100), "EGP", locale)}
            </strong>
          </p>
        </div>

        <Link
          className="group rounded-2xl border border-[#E5DDD0] bg-white p-5 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)] transition-colors hover:border-[#B85A2D]"
          href="/admin/orders"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-[#78716C]">{ov.cards.pipelineTitle}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C7924D]/15 text-[#9A6B2E]">
              <ShoppingBag size={15} aria-hidden />
            </span>
          </div>
          <p className="mt-2 font-editorial text-2xl sm:text-3xl font-black text-[#1C1917] group-hover:text-[#B85A2D]">
            {totalOrders}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
            <span className="rounded-full bg-[#FAF8F5] border border-[#EDE8E0] px-2.5 py-0.5 text-[#665E57]">
              {inProgressOrders} {ov.cards.inProgressLabel}
            </span>
            <span className="rounded-full bg-[#E7ECE5] px-2.5 py-0.5 text-[#2F463B] font-medium">
              {deliveredOrders} {ov.cards.deliveredLabel}
            </span>
          </div>
        </Link>

        <Link
          className="group rounded-2xl border border-[#E5DDD0] bg-white p-5 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)] transition-colors hover:border-[#B85A2D]"
          href="/admin/products"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-[#78716C]">{ov.cards.catalogTitle}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E7ECE5] text-[#2F463B]">
              <PackageCheck size={15} aria-hidden />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="font-editorial text-2xl sm:text-3xl font-black text-[#1C1917] group-hover:text-[#B85A2D]">
              {activeProductsList.length}
            </p>
            <span className="text-xs font-medium text-[#2F463B]">{ov.cards.activeUnit}</span>
            <span className="text-xs text-[#8C827A]">
              · {archivedCount} {ov.cards.archivedUnit}
            </span>
          </div>
          <p className="mt-2 text-xs text-[#78716C] font-light">
            <strong className="font-semibold text-[#1C1917]">{activeStockUnits}</strong>{" "}
            {ov.cards.stockUnitsLabel}
            {lowStockCount > 0 ? (
              <span className="ms-1.5 text-[#B85A2D] font-semibold">
                · {lowStockCount} {ov.cards.lowStockLabel}
              </span>
            ) : null}
          </p>
        </Link>

        <div className="rounded-2xl border border-[#E5DDD0] bg-white p-5 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-[#78716C]">{ov.cards.pulseTitle}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FAF8F5] border border-[#E5DDD0] text-[#1C1917]">
              <Sparkles size={15} aria-hidden />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="font-editorial text-2xl sm:text-3xl font-black text-[#1C1917]">
              {customers}
            </p>
            <span className="text-xs font-medium text-[#78716C]">{ov.cards.customersUnit}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
            <Link
              className="rounded-full bg-[#FAF8F5] border border-[#EDE8E0] px-2.5 py-0.5 text-[#665E57] hover:border-[#B85A2D]"
              href="/admin/coupons"
            >
              {activeCoupons} {ov.cards.couponsUnit}
            </Link>
            <Link
              className="rounded-full bg-[#FAF8F5] border border-[#EDE8E0] px-2.5 py-0.5 text-[#665E57] hover:border-[#B85A2D]"
              href="/admin/reviews"
            >
              {pendingReviews} {ov.cards.reviewsUnit}
            </Link>
          </div>
        </div>
      </section>

      {/* Primary Charts Row: Interactive Trend + Status Donut */}
      <section className="mt-5 grid gap-4 xl:grid-cols-[1.35fr_0.9fr]">
        <SalesTrendChart
          averageOrderValue={averageOrderCents / 100}
          days={days}
          labels={{
            ordersUnit: ov.ordersUnit,
            aovLabel: ov.aovLabel,
            metricRevenue: ov.charts.metricRevenue,
            metricOrders: ov.charts.metricOrders,
            peakDay: ov.charts.peakDay,
            emptyTrendNote: ov.charts.emptyTrendNote
          }}
          locale={locale}
          rangeOrders={rangeOrders}
          rangeRevenueCents={rangeRevenueCents}
          title={ov.salesInRange}
        />

        <StatusDonutChart
          emptyLabel={ov.noOrdersInRange}
          isArabic={isArabic}
          manageLabel={ov.charts.openOrdersLink}
          segments={statusSegments}
          subtitle={ov.charts.statusChartSubtitle}
          title={ov.ordersByStatus}
          total={rangeTotalStatusOrders}
          totalLabel={ov.charts.totalLabel}
        />
      </section>

      {/* Catalog & Inventory Visual Analytics */}
      <section className="mt-4">
        <CatalogInventoryChart
          activeProductsList={activeStockRows}
          avgActivePrice={avgActivePrice}
          categories={categoryBreakdown}
          isArabic={isArabic}
          labels={{
            byCategoryHeading: ov.charts.byCategoryHeading,
            activeStockHeading: ov.charts.activeStockHeading,
            activeUnit: ov.cards.activeUnit,
            archivedUnit: ov.cards.archivedUnit,
            units: ov.charts.units,
            avgPrice: ov.charts.avgPrice,
            openProductsLink: ov.charts.openProductsLink,
            emptyCategoryProducts: ov.charts.emptyCategoryProducts
          }}
          locale={locale}
          subtitle={ov.charts.catalogMixSubtitle}
          title={ov.charts.catalogMixTitle}
        />
      </section>

      {/* Top Demand Horizontal Bar Charts */}
      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        {demandColumns.map((col) => {
          const totalCount = col.rows.reduce((sum, r) => sum + r.count, 0);
          const maxCount = Math.max(1, ...col.rows.map((r) => r.count));
          return (
            <div
              className="min-w-0 rounded-2xl border border-[#E5DDD0] bg-white p-5 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]"
              key={col.title}
            >
              <h2 className="font-editorial text-lg font-bold text-[#1C1917]">{col.title}</h2>
              {col.rows.length === 0 ? (
                <div className="mt-3 rounded-xl border border-[#EDE8E0] bg-[#FAF8F5] px-4 py-3 text-xs text-[#665E57]">
                  <p className="font-medium text-[#1C1917]">{ov.noSalesInRange}</p>
                  <p className="mt-1 font-light text-[#78716C]">{col.emptyHint}</p>
                </div>
              ) : (
                <div className="mt-3.5 grid gap-3">
                  {col.rows.map((row, index) => {
                    const pct = Math.round((row.count / Math.max(1, totalCount)) * 100);
                    const widthPct = Math.max(8, Math.round((row.count / maxCount) * 100));
                    return (
                      <div className="grid gap-1.5" key={row.key}>
                        <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                          <span className="inline-flex min-w-0 items-center gap-2">
                            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FAF8F5] border border-[#E5DDD0] text-[10px] font-bold text-[#8C7A6B]">
                              {index + 1}
                            </span>
                            <span className="truncate font-medium text-[#1C1917]">{row.label}</span>
                          </span>
                          <span className="shrink-0 font-bold text-[#B85A2D]" dir="ltr">
                            ×{row.count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[#EDE8E0]">
                          <div
                            className="h-full rounded-full bg-[#B85A2D] transition-all duration-500"
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </AdminShell>
  );
}
