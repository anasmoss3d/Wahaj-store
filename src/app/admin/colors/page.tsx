import { CheckCircle2, Link2, Palette } from "lucide-react";
import { createColorAction, deleteColorAction, updateColorAction } from "@/app/actions/admin";
import { ActionForm } from "@/components/admin/action-form";
import { HorizontalBarCard, KpiGrid } from "@/components/admin/admin-insights";
import { AdminShell } from "@/components/admin/admin-shell";
import { DeleteButton } from "@/components/admin/delete-button";
import { Field, Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pickLocalized } from "@/lib/dictionary";
import { getAdminDictionary, getLocale } from "@/lib/i18n";
import { PERMISSIONS } from "@/lib/rbac";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ColorsPage() {
  await requireAdmin(PERMISSIONS.PRODUCTS_MANAGE);
  const [locale, dict, colors] = await Promise.all([
    getLocale(),
    getAdminDictionary(),
    prisma.color.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    })
  ]);
  const isArabic = locale === "ar";
  const c = dict.colors;
  const ins = c.insights;

  const activeColorsCount = colors.filter((item) => item.active).length;
  const totalLinked = colors.reduce((sum, item) => sum + item._count.products, 0);

  const chartRows = colors.map((col) => ({
    key: col.id,
    label: pickLocalized(locale, col.name, col.nameEn),
    sublabel: col.hexCode,
    swatch: col.hexCode,
    value: col._count.products,
    displayValue: `${col._count.products} ${ins.productsWord}`,
    color: col.hexCode.toLowerCase() === "#f5f0e8" ? "#C9BFA9" : col.hexCode
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
          {c.kicker}
        </p>
        <h1 className="font-editorial text-3xl sm:text-4xl font-black text-[#1C1917]">
          {c.title}
        </h1>
      </div>

      <KpiGrid
        columns={3}
        items={[
          {
            key: "total",
            label: ins.totalColors,
            value: colors.length,
            tone: "charcoal",
            icon: <Palette size={15} aria-hidden />
          },
          {
            key: "active",
            label: ins.activeColors,
            value: activeColorsCount,
            tone: "sage",
            icon: <CheckCircle2 size={15} aria-hidden />
          },
          {
            key: "linked",
            label: ins.linkedVariants,
            value: totalLinked,
            tone: "terracotta",
            icon: <Link2 size={15} aria-hidden />
          }
        ]}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
        <ActionForm action={createColorAction} submitLabel={c.createSubmit}>
          <Field label={dict.common.nameArPrimary}>
            <Input dir="rtl" name="name" placeholder={c.nameArPlaceholder} required />
          </Field>
          <Field label={dict.common.nameEnSecondary}>
            <Input dir="ltr" name="nameEn" placeholder={c.nameEnPlaceholder} />
          </Field>
          <Field label={c.hexCode}>
            <Input defaultValue="#f4f0e8" dir="ltr" name="hexCode" required />
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
          <HorizontalBarCard rows={chartRows} title={ins.usageTitle} />
          <div className="min-w-0 rounded-2xl border border-[#E5DDD0] bg-white p-5 sm:p-6 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]">
          <h2 className="font-editorial text-2xl font-black text-[#1C1917]">{c.currentTitle}</h2>
          <div className="mt-4 grid gap-3.5">
            {colors.map((color) => (
              <details
                className="rounded-2xl border border-[#EDE8E0] bg-[#FAF8F5] p-4"
                key={color.id}
              >
                <summary className="flex cursor-pointer items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-3">
                    <span
                      className="h-7 w-7 rounded-full border border-[#DED7CB] shadow-sm"
                      style={{ background: color.hexCode }}
                    />
                    <span>
                      <span className="font-editorial text-base font-bold text-[#1C1917]">
                        {color.name}
                      </span>
                      {color.nameEn ? (
                        <span className="ms-2 text-xs text-[#8C827A]">({color.nameEn})</span>
                      ) : null}
                    </span>
                  </span>
                  <span
                    className="rounded-full border border-[#DED7CB] bg-white px-3 py-1 text-xs font-mono text-[#665E57]"
                    dir="ltr"
                  >
                    {color.hexCode}
                  </span>
                </summary>
                <div className="mt-4 grid gap-3 border-t border-[#EDE8E0] pt-4">
                  <ActionForm action={updateColorAction} submitLabel={dict.common.saveChanges}>
                    <input name="id" type="hidden" value={color.id} />
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label={dict.common.nameArPrimary}>
                        <Input defaultValue={color.name} dir="rtl" name="name" required />
                      </Field>
                      <Field label={dict.common.nameEnSecondary}>
                        <Input defaultValue={color.nameEn ?? ""} dir="ltr" name="nameEn" />
                      </Field>
                      <Field label={c.hexCode}>
                        <Input defaultValue={color.hexCode} dir="ltr" name="hexCode" required />
                      </Field>
                      <Field label={dict.common.sortOrder}>
                        <Input
                          defaultValue={color.sortOrder}
                          dir="ltr"
                          name="sortOrder"
                          type="number"
                        />
                      </Field>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-[#1C1917]">
                      <input
                        className="h-5 w-5 rounded accent-[#B85A2D]"
                        defaultChecked={color.active}
                        name="active"
                        type="checkbox"
                      />
                      <span>{dict.common.active}</span>
                    </label>
                  </ActionForm>
                  <DeleteButton action={deleteColorAction} id={color.id} />
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
