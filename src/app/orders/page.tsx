import { StorefrontFooter } from "@/components/storefront/footer";
import { StorefrontHeader } from "@/components/storefront/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { StatusBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await getCurrentUser();
  const orders = user
    ? await prisma.order.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 20
      })
    : [];

  return (
    <>
      <StorefrontHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-4xl font-bold text-concrete-900">Track order</h1>
        <form className="mt-6 grid gap-3 rounded-md border border-concrete-100 bg-white p-5 shadow-soft" action="/orders/lookup">
          <p className="text-sm text-concrete-600">
            Use the secure order link shown after checkout. Logged in customers can also see
            orders below.
          </p>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input name="orderNumber" placeholder="WAH-20261006-0001" />
            <Button type="submit">Track</Button>
          </div>
        </form>

        {orders.length ? (
          <section className="mt-10">
            <h2 className="text-2xl font-bold text-concrete-900">My orders</h2>
            <div className="mt-4 grid gap-3">
              {orders.map((order) => (
                <a
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-concrete-100 bg-white p-4 shadow-soft"
                  href={`/orders/${order.orderNumber}`}
                  key={order.id}
                >
                  <span>
                    <span className="block font-bold text-concrete-900">{order.orderNumber}</span>
                    <span className="text-sm text-concrete-500">{formatMoney(order.grandTotal)}</span>
                  </span>
                  <StatusBadge status={order.status} />
                </a>
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <StorefrontFooter />
    </>
  );
}
