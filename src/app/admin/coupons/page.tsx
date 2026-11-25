import { Percent, Tag, TicketCheck } from "lucide-react";
import { deleteCouponAction, upsertCouponAction } from "@/app/actions/admin";
import { ActionForm } from "@/components/admin/action-form";
import { HorizontalBarCard, KpiGrid } from "@/components/admin/admin-insights";
import { AdminShell } from "@/components/admin/admin-shell";
import { DeleteButton } from "@/components/admin/delete-button";
import { Field, Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAdminDictionary, getLocale } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { PERMISSIONS } from "@/lib/rbac";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CouponsPage() {
  await requireAdmin(PERMISSIONS.MARKETING_MANAGE);
  const [locale, dict, coupons] = await Promise.all([
    getLocale(),
    getAdminDictionary(),
    prisma.coupon.findMany({ orderBy: { createdAt: "desc" } })
  ]);
  const isArabic = locale === "ar";
  const c = dict.coupons;
  const ins = c.insights;

  const now = new Date();
  const activeCount = coupons.filter((item) => item.active).length;
  const totalRedemptions = coupons.reduce((sum, item) => sum + item.usedCount, 0);
  const limitedCoupons = coupons.filter((item) => item.maxUses !== null);
  const totalCapacity = limitedCoupons.reduce((sum, item) => sum + (item.maxUses ?? 0), 0);

  const chartRows = coupons.map((coupon) => {
    const discountLabel =
      coupon.type === "PERCENT"
        ? `${coupon.value}%`
        : formatMoney(coupon.value, "EGP", locale);
    const isExpired = Boolean(coupon.endsAt && coupon.endsAt < now);
    const isScheduled = Boolean(coupon.startsAt && coupon.startsAt > now);
    const statusTag = isExpired
      ? ins.expiredLabel
      : isScheduled
        ? ins.scheduledLabel
        : undefined;
    return {
      key: coupon.id,
      label: coupon.code,
      sublabel: [discountLabel, statusTag].filter(Boolean).join(" · "),
      value: coupon.maxUses ? Math.round((coupon.usedCount / coupon.maxUses) * 100) : coupon.usedCount,
      displayValue: coupon.maxUses
        ? `${coupon.usedCount} / ${coupon.maxUses}`
        : `${coupon.usedCount} / ${ins.unlimitedLabel}`,
      color: isExpired ? "#A65D57" : coupon.active ? "#B85A2D" : "#C9BFA9"
    };
  });

  return (
    <AdminShell>
      <div>
        <p
          className={cn(
            "text-[11px] text-[#8C7A6B] font-medium mb-1",
            !isArabic && "uppercase tracking-[0.2em]"
          )}
        >
          {c.kicker}
        </p>
        <h1 className="font-editorial text-3xl sm:text-4xl font-black text-[#1C1917]">
          {c.title}
        </h1>
        <p className="mt-2 text-sm text-[#665E57] font-light">{c.subtitle}</p>
      </div>

      <KpiGrid
        columns={3}
        items={[
          {
            key: "active",
            label: ins.activeCoupons,
            value: `${activeCount} / ${coupons.length}`,
            tone: "sage",
            icon: <Tag size={15} aria-hidden />
          },
          {
            key: "redemptions",
            label: ins.totalRedemptions,
            value: totalRedemptions,
            tone: "terracotta",
            icon: <TicketCheck size={15} aria-hidden />
          },
          {
            key: "capacity",
            label: ins.totalCapacity,
            value: totalCapacity > 0 ? totalCapacity : ins.unlimitedLabel,
            tone: "gold",
            icon: <Percent size={15} aria-hidden />
          }
        ]}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start">
        <ActionForm action={upsertCouponAction} submitLabel={c.createSubmit}>
          <Field label={c.code}>
            <Input dir="ltr" name="code" placeholder={c.codePlaceholder} required />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end">
            <Field label={c.type}>
              <select
                className="min-h-11 w-full min-w-0 rounded-xl border border-[#DED7CB] bg-white px-3.5 text-sm text-[#1C1917] outline-none focus:border-[#B85A2D] focus:ring-2 focus:ring-[#B85A2D]/20"
                name="type"
              >
                <option value="PERCENT">{c.percentOption}</option>
                <option value="FIXED">{c.fixedOption}</option>
              </select>
            </Field>
            <Field label={c.value}>
              <Input dir="ltr" min="0" name="value" required type="number" />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end">
            <Field label={c.minSubtotal}>
              <Input defaultValue={0} dir="ltr" min="0" name="minSubtotal" type="number" />
            </Field>
            <Field label={c.maxUses}>
              <Input dir="ltr" min="1" name="maxUses" type="number" />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end">
            <Field label={c.startsAt}>
              <Input className="px-3" dir="ltr" name="startsAt" type="date" />
            </Field>
            <Field label={c.endsAt}>
              <Input className="px-3" dir="ltr" name="endsAt" type="date" />
            </Field>
          </div>
          <label className="inline-flex items-center gap-2 text-sm font-medium text-[#1C1917]">
            <input
              className="h-5 w-5 rounded accent-[#B85A2D]"
              defaultChecked
              name="active"
              type="checkbox"
            />
            <span>{dict.common.active}</span>
          </label>
        </ActionForm>
        <div className="grid min-w-0 gap-5">
          <HorizontalBarCard maxOverride={100} rows={chartRows} title={ins.utilizationTitle} />
          <div className="min-w-0 rounded-2xl border border-[#E5DDD0] bg-white p-5 sm:p-6 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]">
          <h2 className="font-editorial text-2xl font-black text-[#1C1917]">{c.currentTitle}</h2>
          <div className="mt-4 grid gap-3.5">
            {coupons.map((coupon) => (
              <details
                className="rounded-2xl border border-[#EDE8E0] bg-[#FAF8F5] p-4"
                key={coupon.id}
              >
                <summary className="flex cursor-pointer items-center justify-between gap-3">
                  <span>
                    <span
                      className="block font-editorial text-base font-bold text-[#1C1917]"
                      dir="ltr"
                    >
                      {coupon.code}
                    </span>
                    <span className="text-sm text-[#78716C] font-light">
                      {coupon.type === "PERCENT"
                        ? `${coupon.value}%`
                        : formatMoney(coupon.value, "EGP", locale)}{" "}
                      · {c.minPrefix} {formatMoney(coupon.minSubtotal, "EGP", locale)} ·{" "}
                      {c.usedPrefix} {coupon.usedCount}
                      {coupon.maxUses ? `/${coupon.maxUses}` : ""}
                    </span>
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium border ${
                      coupon.active
                        ? "border-[#CBD5C8] bg-[#E7ECE5] text-[#2F463B]"
                        : "border-[#DED7CB] bg-white text-[#78716C]"
                    }`}
                  >
                    {coupon.active ? dict.common.active : dict.common.inactive}
                  </span>
                </summary>
                <div className="mt-4 grid gap-3 border-t border-[#EDE8E0] pt-4">
                  <ActionForm action={upsertCouponAction} submitLabel={dict.common.saveChanges}>
                    <input name="id" type="hidden" value={coupon.id} />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end">
                      <Field label={c.code}>
                        <Input defaultValue={coupon.code} dir="ltr" name="code" required />
                      </Field>
                      <Field label={c.type}>
                        <select
                          className="min-h-11 w-full min-w-0 rounded-xl border border-[#DED7CB] bg-white px-3.5 text-sm text-[#1C1917] outline-none focus:border-[#B85A2D] focus:ring-2 focus:ring-[#B85A2D]/20"
                          defaultValue={coupon.type}
                          name="type"
                        >
                          <option value="PERCENT">{c.percentOption}</option>
                          <option value="FIXED">{c.fixedOption}</option>
                        </select>
                      </Field>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end">
                      <Field label={c.value}>
                        <Input
                          defaultValue={String(coupon.value)}
                          dir="ltr"
                          min="0"
                          name="value"
                          required
                          type="number"
                        />
                      </Field>
                      <Field label={c.minSubtotal}>
                        <Input
                          defaultValue={String(coupon.minSubtotal)}
                          dir="ltr"
                          min="0"
                          name="minSubtotal"
                          type="number"
                        />
                      </Field>
                    </div>
                    <Field label={c.maxUses}>
                      <Input
                        defaultValue={coupon.maxUses ?? ""}
                        dir="ltr"
                        min="1"
                        name="maxUses"
                        type="number"
                      />
                    </Field>
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-[#1C1917]">
                      <input
                        className="h-5 w-5 rounded accent-[#B85A2D]"
                        defaultChecked={coupon.active}
                        name="active"
                        type="checkbox"
                      />
                      <span>{dict.common.active}</span>
                    </label>
                  </ActionForm>
                  <DeleteButton action={deleteCouponAction} id={coupon.id} />
                </div>
              </details>
            ))}
          </div>
        </div>
        </div>
      </div>
    </AdminShell>
  );
}
