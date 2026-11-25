import { OrderStatus } from "@prisma/client";
import { Banknote, Clock, PackageCheck, ShoppingBag } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  KpiGrid,
  MiniDailyVolumeChart,
  SegmentedShareCard
} from "@/components/admin/admin-insights";
import { OrdersAutoRefresh } from "@/components/admin/orders-auto-refresh";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  cairoDayKey,
  cairoDayStart,
  formatDate,
  nextCairoDayKey
} from "@/lib/datetime";
import { getAdminDictionary, getLocale, statusLabels, type OrderStatusKey } from "@/lib/i18n";
import { formatMoney, toCents } from "@/lib/money";
import { PERMISSIONS } from "@/lib/rbac";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const STATUS_META: Array<{ key: OrderStatusKey; color: string }> = [
  { key: "PENDING", color: "#C7924D" },
  { key: "PREPARING", color: "#B85A2D" },
  { key: "SHIPPED", color: "#5E6D61" },
  { key: "DELIVERED", color: "#2F463B" },
  { key: "CANCELLED", color: "#A65D57" }
];

export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin(PERMISSIONS.ORDERS_MANAGE);
  const [params, locale, dict] = await Promise.all([
    searchParams,
    getLocale(),
    getAdminDictionary()
  ]);
  const isArabic = locale === "ar";
  const q = one(params.q)?.trim();
  const status = one(params.status);

  const now = new Date();
  const todayKey = cairoDayKey(now);
  const from14Key = cairoDayKey(new Date(now.getTime() - 13 * 24 * 3600 * 1000));

  const [orders, allStatusGroups, grossAgg, recentOrders] = await Promise.all([
    prisma.order.findMany({
      where: {
        ...(status ? { status: status as OrderStatus } : {}),
        ...(q
          ? {
              OR: [
                { orderNumber: { contains: q, mode: "insensitive" } },
                { customerName: { contains: q, mode: "insensitive" } },
                { phone: { contains: q, mode: "insensitive" } }
              ]
            }
          : {})
      },
      orderBy: { createdAt: "desc" },
      take: 100
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { status: true }
    }),
    prisma.order.aggregate({
      where: { status: { not: "CANCELLED" } },
      _sum: { grandTotal: true },
      _count: { id: true }
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: cairoDayStart(from14Key) } },
      select: { createdAt: true, grandTotal: true, status: true }
    })
  ]);

  const latestAt = orders[0]?.createdAt.toISOString() ?? null;
  const countMap = new Map(allStatusGroups.map((row) => [row.status, row._count.status]));
  const totalOrdersCount = allStatusGroups.reduce((sum, row) => sum + row._count.status, 0);
  const activeQueueCount =
    (countMap.get("PENDING") ?? 0) +
    (countMap.get("PREPARING") ?? 0) +
    (countMap.get("SHIPPED") ?? 0);
  const deliveredCount = countMap.get("DELIVERED") ?? 0;
  const nonCancelledCount = grossAgg._count.id;
  const grossCents = toCents(grossAgg._sum.grandTotal ?? "0");
  const avgOrder = nonCancelledCount > 0 ? Math.round(grossCents / nonCancelledCount / 100) : 0;

  const days14: Array<{ key: string; count: number; cents: number }> = [];
  let cursor = from14Key;
  while (cursor <= todayKey && days14.length < 16) {
    days14.push({ key: cursor, count: 0, cents: 0 });
    cursor = nextCairoDayKey(cursor);
  }
  const byDay = new Map(days14.map((d) => [d.key, d]));
  for (const row of recentOrders) {
    const bucket = byDay.get(cairoDayKey(row.createdAt));
    if (bucket) {
      bucket.count += 1;
      if (row.status !== "CANCELLED") {
        bucket.cents += toCents(row.grandTotal);
      }
    }
  }

  const segments = STATUS_META.map(({ key, color }) => ({
    key,
    label: statusLabels[locale][key] ?? key,
    count: countMap.get(key) ?? 0,
    color,
    href: status === key ? "/admin/orders" : `/admin/orders?status=${key}`
  }));

  const ins = dict.orders.insights;

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p
            className={cn(
              "text-[11px] text-[#8C7A6B] font-medium mb-1",
              !isArabic && "uppercase tracking-[0.2em]"
            )}
          >
            {dict.orders.kicker}
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-black text-[#1C1917]">
            {dict.orders.title}
          </h1>
        </div>
        <OrdersAutoRefresh initialLatestAt={latestAt} />
      </div>

      <KpiGrid
        items={[
          {
            key: "total",
            label: ins.totalOrders,
            value: totalOrdersCount,
            tone: "charcoal",
            icon: <ShoppingBag size={15} aria-hidden />
          },
          {
            key: "queue",
            label: ins.activeQueue,
            value: activeQueueCount,
            tone: "gold",
            icon: <Clock size={15} aria-hidden />,
            detail: `${deliveredCount} ${statusLabels[locale].DELIVERED}`
          },
          {
            key: "gross",
            label: ins.totalValue,
            value: formatMoney(String(grossCents / 100), "EGP", locale),
            tone: "terracotta",
            icon: <Banknote size={15} aria-hidden />
          },
          {
            key: "aov",
            label: ins.aov,
            value: formatMoney(String(avgOrder), "EGP", locale),
            tone: "sage",
            icon: <PackageCheck size={15} aria-hidden />
          }
        ]}
      />

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <SegmentedShareCard
          emptyLabel={dict.orders.empty}
          segments={segments}
          title={ins.pipelineTitle}
          total={totalOrdersCount}
        />
        <MiniDailyVolumeChart
          days={days14}
          emptyLabel={ins.noRecentOrders}
          title={ins.last14Days}
        />
      </section>

      <form className="mt-6 grid gap-3 rounded-2xl border border-[#E5DDD0] bg-white p-4 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)] md:grid-cols-[minmax(0,1fr)_220px_auto]">
        <input
          className="min-h-11 w-full min-w-0 rounded-xl border border-[#DED7CB] bg-white px-4 text-sm text-[#1C1917] placeholder:text-[#A8A29E] outline-none transition-all focus:border-[#B85A2D] focus:ring-2 focus:ring-[#B85A2D]/20"
          defaultValue={q}
          name="q"
          placeholder={dict.orders.searchPlaceholder}
        />
        <select
          className="min-h-11 w-full min-w-0 rounded-xl border border-[#DED7CB] bg-white px-4 text-sm text-[#1C1917] outline-none transition-all focus:border-[#B85A2D] focus:ring-2 focus:ring-[#B85A2D]/20"
          defaultValue={status}
          name="status"
        >
          <option value="">{dict.orders.allStatuses}</option>
          {Object.values(OrderStatus).map((item) => (
            <option key={item} value={item}>
              {statusLabels[locale][item as OrderStatusKey] ?? item}
            </option>
          ))}
        </select>
        <button
          className="min-h-11 rounded-full bg-[#B85A2D] px-6 text-sm font-medium text-white shadow-pill transition-all duration-300 hover:bg-[#9E4A22] active:scale-[0.98]"
          type="submit"
        >
          {dict.common.filter}
        </button>
      </form>
      {/* Mobile: order cards. */}
      <div className="mt-6 grid gap-3.5 md:hidden">
        {orders.length === 0 ? (
          <p className="rounded-2xl border border-[#E5DDD0] bg-white p-6 text-sm text-[#78716C] shadow-sm">
            {dict.orders.empty}
          </p>
        ) : (
          orders.map((order) => (
            <article
              className="rounded-2xl border border-[#E5DDD0] bg-white p-5 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]"
              key={order.id}
            >
              <div className="flex items-center justify-between gap-3">
                <a
                  className="font-editorial text-lg font-bold text-[#B85A2D] hover:text-[#9E4A22]"
                  dir="ltr"
                  href={`/admin/orders/${order.id}`}
                >
                  {order.orderNumber}
                </a>
                <StatusBadge locale={locale} status={order.status} />
              </div>
              <p className="mt-2 font-medium text-[#1C1917]">{order.customerName}</p>
              <p className="text-sm text-[#78716C] font-light" dir="ltr">
                {order.phone}
              </p>
              <div className="mt-3.5 flex items-center justify-between border-t border-[#EDE8E0] pt-3 text-sm">
                <span className="text-[#78716C] font-light">
                  {formatDate(order.createdAt, locale)}
                </span>
                <span className="font-bold text-[#1C1917]">
                  {formatMoney(order.grandTotal, "EGP", locale)}
                </span>
              </div>
            </article>
          ))
        )}
      </div>
      {/* Desktop: table. */}
      <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-[#E5DDD0] bg-white shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)] md:block">
        <table className="w-full min-w-[860px] text-sm">
          <thead
            className={cn(
              "bg-[#FAF8F5] text-xs text-[#78716C] border-b border-[#EDE8E0]",
              !isArabic && "uppercase tracking-[0.12em]"
            )}
          >
            <tr>
              <th className="p-4 text-start font-medium">{dict.orders.columns.order}</th>
              <th className="p-4 text-start font-medium">{dict.orders.columns.customer}</th>
              <th className="p-4 text-start font-medium">{dict.orders.columns.phone}</th>
              <th className="p-4 text-start font-medium">{dict.orders.columns.total}</th>
              <th className="p-4 text-start font-medium">{dict.orders.columns.status}</th>
              <th className="p-4 text-start font-medium">{dict.orders.columns.date}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EDE8E0]">
            {orders.length === 0 ? (
              <tr>
                <td className="p-8 text-center text-sm text-[#78716C] font-light" colSpan={6}>
                  {dict.orders.empty}
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr className="transition-colors hover:bg-[#FAF8F5]/70" key={order.id}>
                  <td className="p-4">
                    <a
                      className="font-bold text-[#B85A2D] hover:text-[#9E4A22] transition-colors"
                      dir="ltr"
                      href={`/admin/orders/${order.id}`}
                    >
                      {order.orderNumber}
                    </a>
                  </td>
                  <td className="p-4 font-medium text-[#1C1917]">{order.customerName}</td>
                  <td className="p-4 text-[#665E57]" dir="ltr">
                    {order.phone}
                  </td>
                  <td className="p-4 font-medium text-[#1C1917]">
                    {formatMoney(order.grandTotal, "EGP", locale)}
                  </td>
                  <td className="p-4">
                    <StatusBadge locale={locale} status={order.status} />
                  </td>
                  <td className="p-4 text-[#78716C] font-light">
                    {formatDate(order.createdAt, locale)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
