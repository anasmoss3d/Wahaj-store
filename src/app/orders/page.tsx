import { StorefrontFooter } from "@/components/storefront/footer";
import { StorefrontHeader } from "@/components/storefront/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { getDictionary, getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const [user, dict, locale] = await Promise.all([getCurrentUser(), getDictionary(), getLocale()]);
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
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-12 py-10 sm:py-14">
        <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-black text-[#1C1917]">{dict.trackOrder}</h1>
        <Card className="mt-7 rounded-3xl border-[#E5DDD0]">
          <CardContent className="p-6 sm:p-8">
            <form className="grid gap-4" action="/orders/lookup">
              <p className="text-sm leading-relaxed text-[#665E57] font-light">{dict.trackHint}</p>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <Input name="orderNumber" placeholder="WAH-20261006-0001" className="h-11" required />
                <Button type="submit">{dict.trackBtn}</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {orders.length ? (
          <section className="mt-12">
            <h2 className="font-editorial text-2xl sm:text-3xl font-black text-[#1C1917]">{dict.myOrders}</h2>
            <div className="mt-5 grid gap-3.5">
              {orders.map((order) => (
                <a
                  className="block transition-transform duration-300 hover:-translate-y-0.5"
                  href={`/orders/${order.orderNumber}`}
                  key={order.id}
                >
                  <Card className="border-[#E5DDD0] transition-shadow hover:shadow-[0_18px_42px_-16px_rgba(28,25,23,0.12)]">
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
                      <div>
                        <span className="block font-editorial text-lg font-bold text-[#1C1917]">{order.orderNumber}</span>
                        <span className="text-sm font-medium text-[#B85A2D]">{formatMoney(order.grandTotal, "EGP", locale)}</span>
                      </div>
                      <StatusBadge locale={locale} status={order.status} />
                    </CardContent>
                  </Card>
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
