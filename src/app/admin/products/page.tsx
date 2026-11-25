import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Banknote, Boxes, Layers, Plus } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { HorizontalBarCard, KpiGrid } from "@/components/admin/admin-insights";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { ToggleProductActiveButton } from "@/components/admin/toggle-product-active-button";
import { ButtonLink } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pickLocalized } from "@/lib/dictionary";
import { getAdminDictionary, getLocale } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { PERMISSIONS } from "@/lib/rbac";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type StatusFilter = "all" | "active" | "archived";

function parseStatusFilter(value: string | string[] | undefined): StatusFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "active" || raw === "archived") return raw;
  return "all";
}

function ProductStatusPill({
  active,
  activeLabel,
  archivedLabel
}: {
  active: boolean;
  activeLabel: string;
  archivedLabel: string;
}) {
  return (
    <span
      className={
        active
          ? "inline-flex items-center rounded-full border border-[#CBD5C8] bg-[#E7ECE5] px-3 py-1 text-xs font-medium text-[#2F463B]"
          : "inline-flex items-center rounded-full border border-[#DED7CB] bg-[#F3ECE2] px-3 py-1 text-xs font-medium text-[#78716C]"
      }
    >
      {active ? activeLabel : archivedLabel}
    </span>
  );
}

export default async function AdminProductsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin(PERMISSIONS.PRODUCTS_MANAGE);
  const [resolvedParams, locale, dict] = await Promise.all([
    searchParams ? searchParams : Promise.resolve({}),
    getLocale(),
    getAdminDictionary()
  ]);
  const isArabic = locale === "ar";
  const p = dict.products;
  const statusFilter = parseStatusFilter(
    (resolvedParams as Record<string, string | string[] | undefined>).status
  );

  const products = await prisma.product.findMany({
    include: { category: true, colors: true, addons: true },
    orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }]
  });

  const activeProducts = products.filter((item) => item.active);
  const activeCount = activeProducts.length;
  const archivedCount = products.length - activeCount;
  const totalUnits = products.reduce((sum, item) => sum + item.stockQuantity, 0);
  const activeUnits = activeProducts.reduce((sum, item) => sum + item.stockQuantity, 0);
  const activeStockValue = activeProducts.reduce(
    (sum, item) => sum + Number(item.basePrice) * item.stockQuantity,
    0
  );
  const lowStockCount = activeProducts.filter((item) => item.stockQuantity <= 5).length;

  const categoryTotals = new Map<
    string,
    { label: string; activeCount: number; archivedCount: number }
  >();
  for (const item of products) {
    const label = pickLocalized(locale, item.category.name, item.category.nameEn);
    const current = categoryTotals.get(item.categoryId) ?? {
      label,
      activeCount: 0,
      archivedCount: 0
    };
    if (item.active) current.activeCount += 1;
    else current.archivedCount += 1;
    categoryTotals.set(item.categoryId, current);
  }

  const categoryChartRows = Array.from(categoryTotals.entries()).map(([id, stat]) => ({
    key: id,
    label: stat.label,
    value: stat.activeCount,
    secondaryValue: stat.archivedCount,
    displayValue: `${stat.activeCount} / ${stat.activeCount + stat.archivedCount}`,
    color: "#B85A2D",
    secondaryColor: "#C9BFA9"
  }));

  const stockChartSource = activeProducts.length > 0 ? activeProducts : products.slice(0, 5);
  const stockChartRows = stockChartSource.slice(0, 6).map((item) => ({
    key: item.id,
    label: pickLocalized(locale, item.name, item.nameEn),
    sublabel: formatMoney(item.basePrice, "EGP", locale),
    value: item.stockQuantity,
    displayValue: `${item.stockQuantity} ${p.fields.stock}`,
    color: item.stockQuantity <= 5 ? "#B85A2D" : item.stockQuantity <= 12 ? "#C7924D" : "#5E6D61",
    href: `/admin/products/${item.id}`
  }));
  const filteredProducts =
    statusFilter === "active"
      ? products.filter((item) => item.active)
      : statusFilter === "archived"
        ? products.filter((item) => !item.active)
        : products;

  const filterTabs: Array<{ key: StatusFilter; label: string; count: number; href: string }> = [
    { key: "all", label: p.tabs.all, count: products.length, href: "/admin/products" },
    {
      key: "active",
      label: p.tabs.active,
      count: activeCount,
      href: "/admin/products?status=active"
    },
    {
      key: "archived",
      label: p.tabs.archived,
      count: archivedCount,
      href: "/admin/products?status=archived"
    }
  ];

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p
            className={cn(
              "text-[11px] text-[#8C7A6B] font-medium mb-1",
              !isArabic && "uppercase tracking-[0.2em]"
            )}
          >
            {p.kicker}
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-black text-[#1C1917]">
            {p.title}
          </h1>
          <p className="mt-2 text-sm text-[#665E57] font-light">{p.subtitle}</p>
        </div>
        <ButtonLink href="/admin/products/new">
          <Plus size={18} /> {p.newProduct}
        </ButtonLink>
      </div>

      <KpiGrid
        items={[
          {
            key: "ratio",
            label: p.insights.catalogRatio,
            value: `${activeCount} / ${products.length}`,
            tone: "sage",
            icon: <Layers size={15} aria-hidden />,
            detail: `${archivedCount} ${p.tabs.archived}`
          },
          {
            key: "units",
            label: p.insights.unitsInStock,
            value: activeUnits,
            tone: "charcoal",
            icon: <Boxes size={15} aria-hidden />,
            detail: `${totalUnits} (${p.tabs.all})`
          },
          {
            key: "valuation",
            label: p.insights.inventoryValue,
            value: formatMoney(String(activeStockValue), "EGP", locale),
            tone: "terracotta",
            icon: <Banknote size={15} aria-hidden />
          },
          {
            key: "low",
            label: p.insights.lowStock,
            value: lowStockCount,
            tone: lowStockCount > 0 ? "terracotta" : "gold",
            icon: <AlertTriangle size={15} aria-hidden />
          }
        ]}
      />

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <HorizontalBarCard
          legend={[
            { label: p.tabs.active, color: "#B85A2D" },
            { label: p.tabs.archived, color: "#C9BFA9" }
          ]}
          rows={categoryChartRows}
          title={p.insights.categorySplit}
        />
        <HorizontalBarCard rows={stockChartRows} title={p.insights.stockByProduct} />
      </section>

      {/* Status filter tabs */}
      <nav aria-label={p.filterAriaLabel} className="mt-6 flex flex-wrap items-center gap-2">
        {filterTabs.map((tab) => {
          const isCurrent = statusFilter === tab.key;
          return (
            <Link
              className={
                isCurrent
                  ? "inline-flex min-h-9 items-center gap-2 rounded-full border border-[#1C1917] bg-[#1C1917] px-4 text-xs sm:text-sm font-medium text-[#FAF8F5] transition"
                  : "inline-flex min-h-9 items-center gap-2 rounded-full border border-[#E5DDD0] bg-white px-4 text-xs sm:text-sm font-medium text-[#57534E] transition hover:border-[#B85A2D]/50 hover:text-[#1C1917]"
              }
              href={tab.href}
              key={tab.key}
            >
              <span>{tab.label}</span>
              <span
                className={
                  isCurrent
                    ? "rounded-full bg-white/15 px-2 py-0.5 text-[11px] text-[#FAF8F5]"
                    : "rounded-full bg-[#FAF8F5] px-2 py-0.5 text-[11px] text-[#78716C]"
                }
              >
                {tab.count}
              </span>
            </Link>
          );
        })}
      </nav>

      {filteredProducts.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-[#E5DDD0] bg-white p-10 text-center shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]">
          <p className="font-editorial text-lg font-bold text-[#1C1917]">
            {statusFilter === "archived"
              ? p.empty.archivedTitle
              : statusFilter === "active"
                ? p.empty.activeTitle
                : p.empty.allTitle}
          </p>
          <p className="mt-1.5 text-sm text-[#665E57] font-light">
            {statusFilter === "archived" ? p.empty.archivedHint : p.empty.defaultHint}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: product cards. */}
          <div className="mt-6 grid gap-3.5 md:hidden">
            {filteredProducts.map((product) => {
              const displayName = pickLocalized(locale, product.name, product.nameEn);
              const categoryName = pickLocalized(
                locale,
                product.category.name,
                product.category.nameEn
              );
              return (
                <article
                  className={`rounded-2xl border border-[#E5DDD0] p-5 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)] ${
                    product.active ? "bg-white" : "bg-[#FAF8F5]/85"
                  }`}
                  key={product.id}
                >
                  <a className="flex items-center gap-3.5" href={`/admin/products/${product.id}`}>
                    <Image
                      alt=""
                      className={`h-16 w-16 shrink-0 rounded-xl bg-[#EDE7DD] object-cover ${
                        product.active ? "" : "opacity-75"
                      }`}
                      height={80}
                      src={product.mainImage}
                      width={80}
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-editorial text-base font-bold text-[#1C1917]">
                        {displayName}
                      </span>
                      <span className="text-xs text-[#8C827A]" dir="ltr">
                        {product.sku}
                      </span>
                    </span>
                  </a>
                  <dl className="mt-3.5 grid grid-cols-2 gap-2.5 border-t border-[#EDE8E0] pt-3 text-sm">
                    <div>
                      <dt className="text-xs text-[#78716C]">{p.fields.category}</dt>
                      <dd className="font-semibold text-[#1C1917]">{categoryName}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[#78716C]">{p.fields.price}</dt>
                      <dd className="font-semibold text-[#1C1917]">
                        {formatMoney(product.basePrice, "EGP", locale)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[#78716C]">{p.fields.stock}</dt>
                      <dd className="font-semibold text-[#1C1917]">{product.stockQuantity}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[#78716C]">{p.fields.options}</dt>
                      <dd className="text-[#665E57]">
                        {product.colors.length} {p.fields.colorsWord} · {product.addons.length}{" "}
                        {p.fields.addonsWord}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2.5 border-t border-[#EDE8E0] pt-3">
                    <ProductStatusPill
                      active={product.active}
                      activeLabel={dict.common.active}
                      archivedLabel={dict.common.archived}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <ToggleProductActiveButton
                        active={product.active}
                        id={product.id}
                        name={displayName}
                      />
                      <DeleteProductButton id={product.id} name={displayName} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Desktop: table. */}
          <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-[#E5DDD0] bg-white shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)] md:block">
            <table className="w-full min-w-[920px] text-start text-sm">
              <thead
                className={cn(
                  "bg-[#FAF8F5] text-xs text-[#78716C] border-b border-[#EDE8E0]",
                  !isArabic && "uppercase tracking-[0.12em]"
                )}
              >
                <tr>
                  <th className="p-4 text-start font-medium">{p.fields.product}</th>
                  <th className="p-4 text-start font-medium">{p.fields.category}</th>
                  <th className="p-4 text-start font-medium">{p.fields.price}</th>
                  <th className="p-4 text-start font-medium">{p.fields.stock}</th>
                  <th className="p-4 text-start font-medium">{p.fields.options}</th>
                  <th className="p-4 text-start font-medium">{p.fields.status}</th>
                  <th className="p-4 text-start font-medium">{p.fields.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE8E0]">
                {filteredProducts.map((product) => {
                  const displayName = pickLocalized(locale, product.name, product.nameEn);
                  const categoryName = pickLocalized(
                    locale,
                    product.category.name,
                    product.category.nameEn
                  );
                  return (
                    <tr
                      className={`transition-colors hover:bg-[#FAF8F5]/70 ${
                        product.active ? "" : "bg-[#FAF8F5]/75"
                      }`}
                      key={product.id}
                    >
                      <td className="p-4">
                        <a
                          className="group flex items-center gap-3.5"
                          href={`/admin/products/${product.id}`}
                        >
                          <Image
                            alt=""
                            className={`h-14 w-14 rounded-xl bg-[#EDE7DD] object-cover ${
                              product.active ? "" : "opacity-75"
                            }`}
                            height={80}
                            src={product.mainImage}
                            width={80}
                          />
                          <span>
                            <span className="block font-editorial text-base font-bold text-[#1C1917] transition-colors group-hover:text-[#B85A2D]">
                              {displayName}
                            </span>
                            <span className="text-xs text-[#8C827A]" dir="ltr">
                              {product.sku}
                            </span>
                          </span>
                        </a>
                      </td>
                      <td className="p-4 text-[#57534E]">{categoryName}</td>
                      <td className="p-4 font-semibold text-[#1C1917]">
                        {formatMoney(product.basePrice, "EGP", locale)}
                      </td>
                      <td className="p-4 text-[#1C1917]">{product.stockQuantity}</td>
                      <td className="p-4 text-[#78716C] font-light">
                        {product.colors.length} {p.fields.colorsWord} · {product.addons.length}{" "}
                        {p.fields.addonsWord}
                      </td>
                      <td className="p-4">
                        <ProductStatusPill
                          active={product.active}
                          activeLabel={dict.common.active}
                          archivedLabel={dict.common.archived}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <ToggleProductActiveButton
                            active={product.active}
                            id={product.id}
                            name={displayName}
                          />
                          <DeleteProductButton id={product.id} name={displayName} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AdminShell>
  );
}
