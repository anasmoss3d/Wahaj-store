import { customerLogoutAction } from "@/app/actions/auth";
import { StorefrontFooter } from "@/components/storefront/footer";
import { StorefrontHeader } from "@/components/storefront/header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { getDictionary, getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const [user, dict, locale] = await Promise.all([
    getCurrentUser(),
    getDictionary(),
    getLocale()
  ]);

  if (!user) {
    return (
      <>
        <StorefrontHeader />
        <main className="mx-auto max-w-md px-4 py-12">
          <h1 className="text-3xl font-bold text-concrete-900">{dict.account}</h1>
          <p className="mt-4 leading-7 text-concrete-600">{dict.signInHint}</p>
          <a className="mt-5 inline-flex font-semibold text-wahaj-teal" href="/auth/login">
            {dict.signIn}
          </a>
        </main>
        <StorefrontFooter />
      </>
    );
  }

  const [orders, addresses] = await Promise.all([
    prisma.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.address.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } })
  ]);

  return (
    <>
      <StorefrontHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-concrete-900">{dict.account}</h1>
            <p className="mt-2 text-concrete-600">{user.name}</p>
          </div>
          <form action={customerLogoutAction}>
            <Button type="submit" variant="ghost">
              {dict.signOut}
            </Button>
          </form>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
          <section className="rounded-md border border-concrete-100 bg-white p-5 shadow-soft">
            <h2 className="text-xl font-bold text-concrete-900">{dict.profile}</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div>
                <dt className="text-concrete-500">{dict.phoneNumber}</dt>
                <dd className="font-semibold" dir="ltr">{user.phone}</dd>
              </div>
              <div>
                <dt className="text-concrete-500">{dict.email}</dt>
                <dd className="font-semibold">{user.email || dict.notAdded}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-md border border-concrete-100 bg-white p-5 shadow-soft">
            <h2 className="text-xl font-bold text-concrete-900">{dict.myOrders}</h2>
            <div className="mt-4 grid gap-3">
              {orders.map((order) => (
                <a
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-concrete-50 p-4"
                  href={`/orders/${order.orderNumber}`}
                  key={order.id}
                >
                  <span>
                    <span className="block font-bold">{order.orderNumber}</span>
                    <span className="text-sm text-concrete-500">{formatMoney(order.grandTotal)}</span>
                  </span>
                  <StatusBadge locale={locale} status={order.status} />
                </a>
              ))}
              {!orders.length ? <p className="text-sm text-concrete-500">{dict.noOrders}</p> : null}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-md border border-concrete-100 bg-white p-5 shadow-soft">
          <h2 className="text-xl font-bold text-concrete-900">{dict.savedAddresses}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {addresses.map((address) => (
              <div className="rounded-md bg-concrete-50 p-4 text-sm" key={address.id}>
                <p className="font-semibold">{address.label || address.city}</p>
                <p className="mt-2 leading-6 text-concrete-600">
                  {address.fullAddress}, {address.city}, {address.governorate}
                </p>
              </div>
            ))}
            {!addresses.length ? <p className="text-sm text-concrete-500">{dict.noAddresses}</p> : null}
          </div>
        </section>
      </main>
      <StorefrontFooter />
    </>
  );
}
