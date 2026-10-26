import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cairoDayEnd, cairoDayKey, cairoDayStart } from "@/lib/datetime";
import { formatMoney, toCents } from "@/lib/money";
import { PERMISSIONS } from "@/lib/rbac";

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

export default async function AdminOverviewPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin(PERMISSIONS.DASHBOARD_READ);
  const params = await searchParams;

  const now = new Date();
  const todayKey = cairoDayKey(now);
  const defaultFromKey = cairoDayKey(new Date(now.getTime() - 29 * 24 * 3600 * 1000));
  const fromKey = validDay(one(params.from)) ?? defaultFromKey;
  const toKey = validDay(one(params.to)) ?? todayKey;
  const from = cairoDayStart(fromKey);
  const toEnd = cairoDayEnd(toKey);
  const range = { gte: from, lte: toEnd };

  const [
    totalOrders,
    pendingOrders,
    preparingOrders,
    shippedOrders,
    deliveredOrders,
    totalProducts,
    activeProducts,
    customers,
    revenue,
    statusGroups,
    bestSellers,
    topColors,
    topAddons,
    ordersInRange
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "PREPARING" } }),
    prisma.order.count({ where: { status: "SHIPPED" } }),
    prisma.order.count({ where: { status: "DELIVERED" } }),
    prisma.product.count(),
    prisma.product.count({ where: { active: true } }),
    prisma.user.count(),
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
      where: { order: { createdAt: range, status: { not: "CANCELLED" } } },
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

  const rangeRevenueCents = ordersInRange
    .filter((order) => order.status !== "CANCELLED")
    .reduce((sum, order) => sum + toCents(order.grandTotal), 0);
  const rangeOrders = ordersInRange.filter((order) => order.status !== "CANCELLED").length;
  const averageOrderValue = rangeOrders > 0 ? rangeRevenueCents / rangeOrders / 100 : 0;

  const days: Array<{ key: string; label: string; cents: number }> = [];
  let cursorKey = fromKey;
  while (cursorKey <= toKey && days.length < 62) {
    days.push({ key: cursorKey, label: cursorKey.slice(8), cents: 0 });
    const next = new Date(cairoDayStart(cursorKey).getTime() + 24 * 3600 * 1000);
    cursorKey = cairoDayKey(next);
  }
  const byDay = new Map(days.map((day) => [day.key, day]));
  for (const order of ordersInRange) {
    if (order.status === "CANCELLED") continue;
    const bucket = byDay.get(cairoDayKey(order.createdAt));
    if (bucket) bucket.cents += toCents(order.grandTotal);
  }
  const maxDay = Math.max(1, ...days.map((day) => day.cents));

  const metrics = [
    ["Total Orders", totalOrders],
    ["Pending Orders", pendingOrders],
    ["Preparing Orders", preparingOrders],
    ["Shipped Orders", shippedOrders],
    ["Delivered Orders", deliveredOrders],
    ["Total Products", totalProducts],
    ["Active Products", activeProducts],
    ["Customers", customers],
    ["Revenue", formatMoney(revenue._sum.grandTotal ?? "0")]
  ];

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-concrete-900">Overview</h1>
          <p className="mt-2 text-concrete-600">Orders, revenue, products, and customer growth.</p>
        </div>
        <form className="flex gap-2">
          <input
            className="min-h-10 rounded-md border border-concrete-200 px-3 text-sm"
            defaultValue={fromKey}
            name="from"
            type="date"
          />
          <input
            className="min-h-10 rounded-md border border-concrete-200 px-3 text-sm"
            defaultValue={toKey}
            name="to"
            type="date"
          />
          <button
            className="min-h-10 rounded-md bg-concrete-900 px-4 text-sm font-semibold text-white"
            type="submit"
          >
            Filter
          </button>
        </form>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map(([label, value]) => (
          <article className="rounded-md border border-concrete-100 bg-white p-5 shadow-soft" key={label}>
            <p className="text-sm text-concrete-500">{label}</p>
            <p className="mt-3 text-3xl font-bold text-concrete-900">{value}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-md border border-concrete-100 bg-white p-5 shadow-soft">
          <h2 className="text-xl font-bold text-concrete-900">Sales in range</h2>
          <p className="mt-1 text-sm text-concrete-500">
            {formatMoney(String(rangeRevenueCents / 100))} · {rangeOrders} orders · AOV{" "}
            {formatMoney(String(averageOrderValue))}
          </p>
          <div className="mt-5 flex h-40 items-end gap-1">
            {days.map((day) => (
              <div
                className="min-w-2 flex-1 rounded-t bg-wahaj-teal/80"
                key={day.key}
                style={{ height: `${Math.max(3, (day.cents / maxDay) * 100)}%` }}
                title={`${day.key}: ${formatMoney(String(day.cents / 100))}`}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-concrete-400">
            <span>{days[0]?.key}</span>
            <span>{days[days.length - 1]?.key}</span>
          </div>
        </article>

        <article className="rounded-md border border-concrete-100 bg-white p-5 shadow-soft">
          <h2 className="text-xl font-bold text-concrete-900">Orders by status</h2>
          <div className="mt-4 grid gap-2 text-sm">
            {statusGroups.length === 0 ? (
              <p className="text-concrete-500">No orders in this range.</p>
            ) : (
              statusGroups.map((row) => (
                <div className="flex justify-between rounded-md bg-concrete-50 px-3 py-2" key={row.status}>
                  <span className="font-semibold">{row.status}</span>
                  <span>{row._count.status}</span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <article className="rounded-md border border-concrete-100 bg-white p-5 shadow-soft">
          <h2 className="text-xl font-bold text-concrete-900">Best sellers</h2>
          <div className="mt-4 grid gap-2 text-sm">
            {bestSellers.length === 0 ? (
              <p className="text-concrete-500">No sales in this range.</p>
            ) : (
              bestSellers.map((row) => (
                <div className="flex justify-between gap-2 rounded-md bg-concrete-50 px-3 py-2" key={row.productId}>
                  <span className="truncate font-semibold">{row.productName}</span>
                  <span>×{row._sum.quantity ?? 0}</span>
                </div>
              ))
            )}
          </div>
        </article>
        <article className="rounded-md border border-concrete-100 bg-white p-5 shadow-soft">
          <h2 className="text-xl font-bold text-concrete-900">Top colors</h2>
          <div className="mt-4 grid gap-2 text-sm">
            {topColors.length === 0 ? (
              <p className="text-concrete-500">No sales in this range.</p>
            ) : (
              topColors.map((row) => (
                <div
                  className="flex justify-between gap-2 rounded-md bg-concrete-50 px-3 py-2"
                  key={row.selectedColorName}
                >
                  <span className="truncate font-semibold">{row.selectedColorName}</span>
                  <span>×{row._sum.quantity ?? 0}</span>
                </div>
              ))
            )}
          </div>
        </article>
        <article className="rounded-md border border-concrete-100 bg-white p-5 shadow-soft">
          <h2 className="text-xl font-bold text-concrete-900">Top add-ons</h2>
          <div className="mt-4 grid gap-2 text-sm">
            {topAddons.length === 0 ? (
              <p className="text-concrete-500">No sales in this range.</p>
            ) : (
              topAddons.map((row) => (
                <div className="flex justify-between gap-2 rounded-md bg-concrete-50 px-3 py-2" key={row.addonName}>
                  <span className="truncate font-semibold">{row.addonName}</span>
                  <span>×{row._count.addonName}</span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </AdminShell>
  );
}
