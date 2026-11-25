import { logoutAction } from "@/app/actions/auth";
import { StorefrontFooter } from "@/components/storefront/footer";
import { StorefrontHeader } from "@/components/storefront/header";
import { Button, ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { getCurrentAdmin, getCurrentUser } from "@/lib/auth";
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
    const admin = await getCurrentAdmin();
    if (admin) {
      return (
        <>
          <StorefrontHeader />
          <main className="mx-auto max-w-md px-4 py-14">
            <div className="rounded-3xl border border-[#E5DDD0] bg-white p-8 shadow-[0_18px_50px_-15px_rgba(28,25,23,0.1)]">
              <h1 className="font-editorial text-3xl font-black text-[#1C1917]">
                {dict.signedInAsAdmin}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-[#665E57] font-light">
                {dict.adminAccountHint}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <ButtonLink href="/admin">{dict.openDashboard}</ButtonLink>
                <form action={logoutAction}>
                  <Button type="submit" variant="outline">
                    {dict.signOut}
                  </Button>
                </form>
              </div>
            </div>
          </main>
          <StorefrontFooter />
        </>
      );
    }

    return (
      <>
        <StorefrontHeader />
        <main className="mx-auto max-w-md px-4 py-14">
          <div className="rounded-3xl border border-[#E5DDD0] bg-white p-8 shadow-[0_18px_50px_-15px_rgba(28,25,23,0.1)]">
            <h1 className="font-editorial text-3xl font-black text-[#1C1917]">{dict.account}</h1>
            <p className="mt-3 text-sm leading-relaxed text-[#665E57] font-light">{dict.signInHint}</p>
            <a
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#B85A2D] px-6 py-2.5 text-sm font-medium text-white shadow-pill transition-all duration-300 hover:bg-[#9E4A22]"
              href="/auth/login"
            >
              {dict.signIn}
            </a>
          </div>
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
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-12 py-10 sm:py-14">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-black text-[#1C1917]">{dict.account}</h1>
            <p className="mt-2 text-base text-[#665E57] font-light">{user.name}</p>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="outline">
              {dict.signOut}
            </Button>
          </form>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
          <section className="rounded-2xl border border-[#E5DDD0] bg-white p-6 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)] h-fit">
            <h2 className="font-editorial text-2xl font-black text-[#1C1917]">{dict.profile}</h2>
            <dl className="mt-4 grid gap-4 text-sm">
              <div>
                <dt className="text-xs text-[#8C827A]">{dict.phoneNumber}</dt>
                <dd className="mt-0.5 font-semibold text-[#1C1917]" dir="ltr">{user.phone}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#8C827A]">{dict.email}</dt>
                <dd className="mt-0.5 font-semibold text-[#1C1917]">{user.email || dict.notAdded}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-[#E5DDD0] bg-white p-6 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]">
            <h2 className="font-editorial text-2xl font-black text-[#1C1917]">{dict.myOrders}</h2>
            <div className="mt-4 grid gap-3">
              {orders.map((order) => (
                <a
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#EDE8E0] bg-[#FAF8F5] p-4 transition hover:border-[#B85A2D]/50 hover:bg-white"
                  href={`/orders/${order.orderNumber}`}
                  key={order.id}
                >
                  <span>
                    <span className="block font-editorial text-base font-bold text-[#1C1917]">{order.orderNumber}</span>
                    <span className="text-sm font-medium text-[#B85A2D]">{formatMoney(order.grandTotal, "EGP", locale)}</span>
                  </span>
                  <StatusBadge locale={locale} status={order.status} />
                </a>
              ))}
              {!orders.length ? <p className="text-sm text-[#78716C] font-light">{dict.noOrders}</p> : null}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-[#E5DDD0] bg-white p-6 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]">
          <h2 className="font-editorial text-2xl font-black text-[#1C1917]">{dict.savedAddresses}</h2>
          <div className="mt-4 grid gap-3.5 md:grid-cols-2">
            {addresses.map((address) => (
              <div className="rounded-2xl border border-[#EDE8E0] bg-[#FAF8F5] p-4 text-sm" key={address.id}>
                <p className="font-semibold text-[#1C1917]">{address.label || address.city}</p>
                <p className="mt-1.5 leading-relaxed text-[#665E57] font-light">
                  {address.fullAddress}, {address.city}, {address.governorate}
                </p>
              </div>
            ))}
            {!addresses.length ? <p className="text-sm text-[#78716C] font-light">{dict.noAddresses}</p> : null}
          </div>
        </section>
      </main>
      <StorefrontFooter />
    </>
  );
}
