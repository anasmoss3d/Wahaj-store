import { Banknote, CheckCircle2, Link2, Sparkles } from "lucide-react";
import { createAddonAction, deleteAddonAction, updateAddonAction } from "@/app/actions/admin";
import { ActionForm } from "@/components/admin/action-form";
import { HorizontalBarCard, KpiGrid } from "@/components/admin/admin-insights";
import { AdminShell } from "@/components/admin/admin-shell";
import { DeleteButton } from "@/components/admin/delete-button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pickLocalized } from "@/lib/dictionary";
import { getAdminDictionary, getLocale } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { PERMISSIONS } from "@/lib/rbac";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AddonsPage() {
  await requireAdmin(PERMISSIONS.PRODUCTS_MANAGE);
  const [locale, dict, addons] = await Promise.all([
    getLocale(),
    getAdminDictionary(),
    prisma.addon.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    })
  ]);
  const isArabic = locale === "ar";
  const a = dict.addons;
  const ins = a.insights;

  const activeAddonsCount = addons.filter((item) => item.active).length;
  const totalAttached = addons.reduce((sum, item) => sum + item._count.products, 0);
  const prices = addons.map((item) => Number(item.price));
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  const chartRows = addons.map((addon) => ({
    key: addon.id,
    label: pickLocalized(locale, addon.name, addon.nameEn),
    sublabel: `${addon._count.products} ${ins.productsWord}`,
    value: Number(addon.price),
    displayValue: formatMoney(addon.price, "EGP", locale),
    color: addon.active ? "#B85A2D" : "#C9BFA9"
  }));

  return (
    <AdminShell>
      <div>
        <p
          className={cn(
            "text-[11px] text-[#8C7A6B] font-medium mb-1",
            !isArabic && "uppercase tracking-[0.2em]"
          )}
        >
          {a.kicker}
        </p>
        <h1 className="font-editorial text-3xl sm:text-4xl font-black text-[#1C1917]">
          {a.title}
        </h1>
      </div>

      <KpiGrid
        items={[
          {
            key: "total",
            label: ins.totalAddons,
            value: addons.length,
            tone: "charcoal",
            icon: <Sparkles size={15} aria-hidden />
          },
          {
            key: "active",
            label: ins.activeAddons,
            value: activeAddonsCount,
            tone: "sage",
            icon: <CheckCircle2 size={15} aria-hidden />
          },
          {
            key: "range",
            label: ins.priceRange,
            value: minPrice === maxPrice ? String(minPrice) : `${minPrice}–${maxPrice}`,
            tone: "gold",
            icon: <Banknote size={15} aria-hidden />,
            detail: dict.common.egp
          },
          {
            key: "attached",
            label: ins.attachedProducts,
            value: totalAttached,
            tone: "terracotta",
            icon: <Link2 size={15} aria-hidden />
          }
        ]}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
        <ActionForm action={createAddonAction} submitLabel={a.createSubmit}>
          <Field label={dict.common.nameArPrimary}>
            <Input dir="rtl" name="name" placeholder={a.nameArPlaceholder} required />
          </Field>
          <Field label={dict.common.nameEnSecondary}>
            <Input dir="ltr" name="nameEn" placeholder={a.nameEnPlaceholder} />
          </Field>
          <Field label={dict.common.descriptionArPrimary}>
            <Textarea dir="rtl" name="description" />
          </Field>
          <Field label={dict.common.descriptionEnSecondary}>
            <Textarea dir="ltr" name="descriptionEn" />
          </Field>
          <Field label={a.price}>
            <Input defaultValue={0} dir="ltr" min="0" name="price" type="number" />
          </Field>
          <Field label={dict.common.imageUrl}>
            <Input dir="ltr" name="imageUrl" />
          </Field>
          <Field label={dict.common.sortOrder}>
            <Input defaultValue={0} dir="ltr" name="sortOrder" type="number" />
          </Field>
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
          <HorizontalBarCard rows={chartRows} title={ins.comparisonTitle} />
          <div className="min-w-0 rounded-2xl border border-[#E5DDD0] bg-white p-5 sm:p-6 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]">
          <h2 className="font-editorial text-2xl font-black text-[#1C1917]">{a.currentTitle}</h2>
          <div className="mt-4 grid gap-3.5">
            {addons.map((addon) => (
              <details
                className="rounded-2xl border border-[#EDE8E0] bg-[#FAF8F5] p-4"
                key={addon.id}
              >
                <summary className="flex cursor-pointer items-center justify-between gap-3">
                  <span>
                    <span className="block font-editorial text-base font-bold text-[#1C1917]">
                      {addon.name}
                      {addon.nameEn ? (
                        <span className="ms-2 text-xs font-normal text-[#8C827A]">
                          ({addon.nameEn})
                        </span>
                      ) : null}
                    </span>
                    <span className="text-sm text-[#78716C] font-light">{addon.description}</span>
                  </span>
                  <span className="shrink-0 rounded-full border border-[#DED7CB] bg-white px-3 py-1 text-xs font-semibold text-[#1C1917]">
                    {formatMoney(addon.price, "EGP", locale)}
                  </span>
                </summary>
                <div className="mt-4 grid gap-3 border-t border-[#EDE8E0] pt-4">
                  <ActionForm action={updateAddonAction} submitLabel={dict.common.saveChanges}>
                    <input name="id" type="hidden" value={addon.id} />
                    <div className="grid gap-3 md:grid-cols-3">
                      <Field label={dict.common.nameArPrimary}>
                        <Input defaultValue={addon.name} dir="rtl" name="name" required />
                      </Field>
                      <Field label={dict.common.nameEnSecondary}>
                        <Input defaultValue={addon.nameEn ?? ""} dir="ltr" name="nameEn" />
                      </Field>
                      <Field label={a.price}>
                        <Input
                          defaultValue={String(addon.price)}
                          dir="ltr"
                          min="0"
                          name="price"
                          type="number"
                        />
                      </Field>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label={dict.common.descriptionArPrimary}>
                        <Textarea
                          defaultValue={addon.description ?? ""}
                          dir="rtl"
                          name="description"
                        />
                      </Field>
                      <Field label={dict.common.descriptionEnSecondary}>
                        <Textarea
                          defaultValue={addon.descriptionEn ?? ""}
                          dir="ltr"
                          name="descriptionEn"
                        />
                      </Field>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label={dict.common.imageUrl}>
                        <Input defaultValue={addon.imageUrl ?? ""} dir="ltr" name="imageUrl" />
                      </Field>
                      <Field label={dict.common.sortOrder}>
                        <Input
                          defaultValue={addon.sortOrder}
                          dir="ltr"
                          name="sortOrder"
                          type="number"
                        />
                      </Field>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-[#1C1917]">
                      <input
                        className="h-5 w-5 rounded accent-[#B85A2D]"
                        defaultChecked={addon.active}
                        name="active"
                        type="checkbox"
                      />
                      <span>{dict.common.active}</span>
                    </label>
                  </ActionForm>
                  <DeleteButton action={deleteAddonAction} id={addon.id} />
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
