import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { PERMISSIONS } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireAdmin(PERMISSIONS.DASHBOARD_READ);

  const [
    totalOrders,
    pendingOrders,
    preparingOrders,
    shippedOrders,
    deliveredOrders,
    totalProducts,
    activeProducts,
    customers,
    revenue
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
    })
  ]);

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
          <input className="min-h-10 rounded-md border border-concrete-200 px-3 text-sm" type="date" />
          <input className="min-h-10 rounded-md border border-concrete-200 px-3 text-sm" type="date" />
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
    </AdminShell>
  );
}
