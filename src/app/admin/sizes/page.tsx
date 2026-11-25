import { CheckCircle2, Layers, Ruler } from "lucide-react";
import { createSizeAction, deleteSizeAction, updateSizeAction } from "@/app/actions/admin";
import { ActionForm } from "@/components/admin/action-form";
import { HorizontalBarCard, KpiGrid } from "@/components/admin/admin-insights";
import { AdminShell } from "@/components/admin/admin-shell";
import { DeleteButton } from "@/components/admin/delete-button";
import { Field, Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pickLocalized } from "@/lib/dictionary";
import { getAdminDictionary, getLocale } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { PERMISSIONS } from "@/lib/rbac";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SizesPage() {
  await requireAdmin(PERMISSIONS.PRODUCTS_MANAGE);
  const [locale, dict, sizes] = await Promise.all([
    getLocale(),
    getAdminDictionary(),
    prisma.size.findMany({
      include: { products: { select: { price: true } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    })
  ]);
  const isArabic = locale === "ar";
  const s = dict.sizes;
  const ins = s.insights;

  const activeSizesCount = sizes.filter((item) => item.active).length;
  const totalVariants = sizes.reduce((sum, item) => sum + item.products.length, 0);

  const chartRows = sizes.map((size) => {
    const avgPrice =
      size.products.length > 0
        ? Math.round(
            size.products.reduce((sum, p) => sum + Number(p.price), 0) / size.products.length
          )
        : 0;
    return {
      key: size.id,
      label: pickLocalized(locale, size.name, size.nameEn),
      sublabel: avgPrice > 0 ? formatMoney(String(avgPrice), "EGP", locale) : undefined,
      value: size.products.length,
      displayValue: `${size.products.length} ${ins.variantsWord}`,
      color: size.active ? "#5E6D61" : "#C9BFA9"
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
          {s.kicker}
        </p>
        <h1 className="font-editorial text-3xl sm:text-4xl font-black text-[#1C1917]">
          {s.title}
        </h1>
        <p className="mt-2 text-sm text-[#665E57] font-light">{s.subtitle}</p>
      </div>

      <KpiGrid
        columns={3}
        items={[
          {
            key: "total",
            label: ins.totalSizes,
            value: sizes.length,
            tone: "charcoal",
            icon: <Ruler size={15} aria-hidden />
          },
          {
            key: "active",
            label: ins.activeSizes,
            value: activeSizesCount,
            tone: "sage",
            icon: <CheckCircle2 size={15} aria-hidden />
          },
          {
            key: "variants",
            label: ins.linkedVariants,
            value: totalVariants,
            tone: "terracotta",
            icon: <Layers size={15} aria-hidden />
          }
        ]}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
        <ActionForm action={createSizeAction} submitLabel={s.createSubmit}>
          <Field label={dict.common.nameArPrimary}>
            <Input dir="rtl" name="name" placeholder={s.nameArPlaceholder} required />
          </Field>
          <Field label={dict.common.nameEnSecondary}>
            <Input dir="ltr" name="nameEn" placeholder={s.nameEnPlaceholder} />
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
          <HorizontalBarCard emptyLabel={s.empty} rows={chartRows} title={ins.adoptionTitle} />
          <div className="min-w-0 rounded-2xl border border-[#E5DDD0] bg-white p-5 sm:p-6 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]">
          <h2 className="font-editorial text-2xl font-black text-[#1C1917]">{s.currentTitle}</h2>
          <div className="mt-4 grid gap-3.5">
            {sizes.length === 0 ? (
              <p className="text-sm text-[#78716C] font-light">{s.empty}</p>
            ) : null}
            {sizes.map((size) => (
              <details
                className="rounded-2xl border border-[#EDE8E0] bg-[#FAF8F5] p-4"
                key={size.id}
              >
                <summary className="flex cursor-pointer items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-3">
                    <span className="font-editorial text-base font-bold text-[#1C1917]">
                      {size.name}
                    </span>
                    {size.nameEn ? (
                      <span className="text-xs text-[#8C827A]">({size.nameEn})</span>
                    ) : null}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium border ${
                      size.active
                        ? "border-[#CBD5C8] bg-[#E7ECE5] text-[#2F463B]"
                        : "border-[#DED7CB] bg-white text-[#78716C]"
                    }`}
                  >
                    {size.active ? dict.common.active : dict.common.hidden}
                  </span>
                </summary>
                <div className="mt-4 grid gap-3 border-t border-[#EDE8E0] pt-4">
                  <ActionForm action={updateSizeAction} submitLabel={dict.common.saveChanges}>
                    <input name="id" type="hidden" value={size.id} />
                    <div className="grid gap-3 md:grid-cols-3">
                      <Field label={dict.common.nameArPrimary}>
                        <Input defaultValue={size.name} dir="rtl" name="name" required />
                      </Field>
                      <Field label={dict.common.nameEnSecondary}>
                        <Input defaultValue={size.nameEn ?? ""} dir="ltr" name="nameEn" />
                      </Field>
                      <Field label={dict.common.sortOrder}>
                        <Input
                          defaultValue={size.sortOrder}
                          dir="ltr"
                          name="sortOrder"
                          type="number"
                        />
                      </Field>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-[#1C1917]">
                      <input
                        className="h-5 w-5 rounded accent-[#B85A2D]"
                        defaultChecked={size.active}
                        name="active"
                        type="checkbox"
                      />
                      <span>{dict.common.active}</span>
                    </label>
                  </ActionForm>
                  <DeleteButton action={deleteSizeAction} id={size.id} />
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
