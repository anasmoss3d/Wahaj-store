import { FolderTree, Layers, PackageCheck } from "lucide-react";
import { createCategoryAction, deleteCategoryAction, updateCategoryAction } from "@/app/actions/admin";
import { ActionForm } from "@/components/admin/action-form";
import { HorizontalBarCard, KpiGrid } from "@/components/admin/admin-insights";
import { AdminShell } from "@/components/admin/admin-shell";
import { DeleteButton } from "@/components/admin/delete-button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pickLocalized } from "@/lib/dictionary";
import { getAdminDictionary, getLocale } from "@/lib/i18n";
import { PERMISSIONS } from "@/lib/rbac";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  await requireAdmin(PERMISSIONS.PRODUCTS_MANAGE);
  const [locale, dict, categories] = await Promise.all([
    getLocale(),
    getAdminDictionary(),
    prisma.category.findMany({
      include: { products: { select: { active: true } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    })
  ]);
  const isArabic = locale === "ar";
  const c = dict.categories;
  const ins = c.insights;

  const activeCategoriesCount = categories.filter((item) => item.active).length;
  const totalAssigned = categories.reduce((sum, item) => sum + item.products.length, 0);

  const chartRows = categories.map((cat) => {
    const activeCount = cat.products.filter((p) => p.active).length;
    const archivedCount = cat.products.length - activeCount;
    return {
      key: cat.id,
      label: pickLocalized(locale, cat.name, cat.nameEn),
      value: activeCount,
      secondaryValue: archivedCount,
      displayValue:
        cat.products.length === 0 ? ins.emptyWord : `${activeCount} / ${cat.products.length}`,
      color: "#B85A2D",
      secondaryColor: "#C9BFA9"
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
      </div>

      <KpiGrid
        columns={3}
        items={[
          {
            key: "total",
            label: ins.totalCategories,
            value: categories.length,
            tone: "charcoal",
            icon: <FolderTree size={15} aria-hidden />
          },
          {
            key: "active",
            label: ins.activeCategories,
            value: activeCategoriesCount,
            tone: "sage",
            icon: <Layers size={15} aria-hidden />
          },
          {
            key: "products",
            label: ins.assignedProducts,
            value: totalAssigned,
            tone: "terracotta",
            icon: <PackageCheck size={15} aria-hidden />
          }
        ]}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
        <ActionForm action={createCategoryAction} submitLabel={c.createSubmit}>
          <Field label={dict.common.nameArPrimary}>
            <Input dir="rtl" name="name" placeholder={c.nameArPlaceholder} required />
          </Field>
          <Field label={dict.common.nameEnSecondary}>
            <Input dir="ltr" name="nameEn" placeholder={c.nameEnPlaceholder} />
          </Field>
          <Field label={c.slug}>
            <Input dir="ltr" name="slug" required />
          </Field>
          <Field label={dict.common.descriptionArPrimary}>
            <Textarea dir="rtl" name="description" />
          </Field>
          <Field label={dict.common.descriptionEnSecondary}>
            <Textarea dir="ltr" name="descriptionEn" />
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
          <HorizontalBarCard
            legend={[
              { label: ins.activeLabel, color: "#B85A2D" },
              { label: ins.archivedLabel, color: "#C9BFA9" }
            ]}
            rows={chartRows}
            title={ins.breakdownTitle}
          />
          <div className="min-w-0 rounded-2xl border border-[#E5DDD0] bg-white p-5 sm:p-6 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]">
          <h2 className="font-editorial text-2xl font-black text-[#1C1917]">{c.currentTitle}</h2>
          <div className="mt-4 grid gap-3.5">
            {categories.map((category) => (
              <details
                className="rounded-2xl border border-[#EDE8E0] bg-[#FAF8F5] p-4"
                key={category.id}
              >
                <summary className="flex cursor-pointer items-center justify-between gap-3">
                  <span>
                    <span className="block font-editorial text-base font-bold text-[#1C1917]">
                      {category.name}
                      {category.nameEn ? (
                        <span className="ms-2 text-xs font-normal text-[#8C827A]">
                          ({category.nameEn})
                        </span>
                      ) : null}
                    </span>
                    <span className="text-sm text-[#78716C] font-light" dir="ltr">
                      {category.slug}
                    </span>
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium border ${
                      category.active
                        ? "border-[#CBD5C8] bg-[#E7ECE5] text-[#2F463B]"
                        : "border-[#DED7CB] bg-white text-[#78716C]"
                    }`}
                  >
                    {category.active ? dict.common.active : dict.common.inactive}
                  </span>
                </summary>
                <div className="mt-4 grid gap-3 border-t border-[#EDE8E0] pt-4">
                  <ActionForm action={updateCategoryAction} submitLabel={dict.common.saveChanges}>
                    <input name="id" type="hidden" value={category.id} />
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label={dict.common.nameArPrimary}>
                        <Input defaultValue={category.name} dir="rtl" name="name" required />
                      </Field>
                      <Field label={dict.common.nameEnSecondary}>
                        <Input defaultValue={category.nameEn ?? ""} dir="ltr" name="nameEn" />
                      </Field>
                    </div>
                    <Field label={c.slug}>
                      <Input defaultValue={category.slug} dir="ltr" name="slug" required />
                    </Field>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label={dict.common.descriptionArPrimary}>
                        <Textarea
                          defaultValue={category.description ?? ""}
                          dir="rtl"
                          name="description"
                        />
                      </Field>
                      <Field label={dict.common.descriptionEnSecondary}>
                        <Textarea
                          defaultValue={category.descriptionEn ?? ""}
                          dir="ltr"
                          name="descriptionEn"
                        />
                      </Field>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label={dict.common.imageUrl}>
                        <Input defaultValue={category.imageUrl ?? ""} dir="ltr" name="imageUrl" />
                      </Field>
                      <Field label={dict.common.sortOrder}>
                        <Input
                          defaultValue={category.sortOrder}
                          dir="ltr"
                          name="sortOrder"
                          type="number"
                        />
                      </Field>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-[#1C1917]">
                      <input
                        className="h-5 w-5 rounded accent-[#B85A2D]"
                        defaultChecked={category.active}
                        name="active"
                        type="checkbox"
                      />
                      <span>{dict.common.active}</span>
                    </label>
                  </ActionForm>
                  <DeleteButton action={deleteCategoryAction} id={category.id} />
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
