import { OrderStatus } from "@prisma/client";
import { AdminShell } from "@/components/admin/admin-shell";
import { OrdersAutoRefresh } from "@/components/admin/orders-auto-refresh";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/datetime";
import { formatMoney } from "@/lib/money";
import { PERMISSIONS } from "@/lib/rbac";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin(PERMISSIONS.ORDERS_MANAGE);
  const params = await searchParams;
  const q = one(params.q)?.trim();
  const status = one(params.status);

  const orders = await prisma.order.findMany({
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
  });
  const latestAt = orders[0]?.createdAt.toISOString() ?? null;

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold text-concrete-900">Orders</h1>
        <OrdersAutoRefresh initialLatestAt={latestAt} />
      </div>
      <form className="mt-6 grid gap-3 rounded-md border border-concrete-100 bg-white p-4 shadow-soft md:grid-cols-[1fr_220px_auto]">
        <input
          className="min-h-11 rounded-md border border-concrete-200 px-3"
          defaultValue={q}
          name="q"
          placeholder="Order number, customer, phone"
        />
        <select className="min-h-11 rounded-md border border-concrete-200 px-3" defaultValue={status} name="status">
          <option value="">All statuses</option>
          {Object.values(OrderStatus).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button className="rounded-md bg-wahaj-teal px-4 font-semibold text-white" type="submit">
          Filter
        </button>
      </form>
      <div className="mt-8 overflow-x-auto rounded-md border border-concrete-100 bg-white shadow-soft">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-concrete-50 text-concrete-500">
            <tr>
              <th className="p-4 text-start">Order</th>
              <th className="p-4 text-start">Customer</th>
              <th className="p-4 text-start">Phone</th>
              <th className="p-4 text-start">Total</th>
              <th className="p-4 text-start">Status</th>
              <th className="p-4 text-start">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-concrete-100">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="p-4">
                  <a className="font-bold text-wahaj-teal" href={`/admin/orders/${order.id}`}>
                    {order.orderNumber}
                  </a>
                </td>
                <td className="p-4">{order.customerName}</td>
                <td className="p-4">{order.phone}</td>
                <td className="p-4">{formatMoney(order.grandTotal)}</td>
                <td className="p-4">
                  <StatusBadge status={order.status} />
                </td>
                <td className="p-4">{formatDate(order.createdAt, "en")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
