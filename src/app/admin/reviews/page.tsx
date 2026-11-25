import Link from "next/link";
import { CheckCircle2, Clock, MessageSquare, Star } from "lucide-react";
import { approveReviewAction, deleteReviewAction } from "@/app/actions/admin";
import { ActionForm } from "@/components/admin/action-form";
import {
  HorizontalBarCard,
  KpiGrid,
  SegmentedShareCard
} from "@/components/admin/admin-insights";
import { AdminShell } from "@/components/admin/admin-shell";
import { DeleteButton } from "@/components/admin/delete-button";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pickLocalized } from "@/lib/dictionary";
import { getAdminDictionary, getLocale } from "@/lib/i18n";
import { PERMISSIONS } from "@/lib/rbac";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function parseFilter(value: string | string[] | undefined): "all" | "pending" | "approved" {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "pending" || raw === "approved") return raw;
  return "all";
}

export default async function ReviewsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin(PERMISSIONS.PRODUCTS_MANAGE);
  const [params, locale, dict, allReviews] = await Promise.all([
    searchParams ?? Promise.resolve({} as Awaited<SearchParams>),
    getLocale(),
    getAdminDictionary(),
    prisma.review.findMany({
      include: { product: true },
      orderBy: { createdAt: "desc" },
      take: 200
    })
  ]);
  const isArabic = locale === "ar";
  const r = dict.reviews;
  const filter = parseFilter(params.filter);

  const totalCount = allReviews.length;
  const approvedCount = allReviews.filter((item) => item.approved).length;
  const pendingCount = totalCount - approvedCount;
  const avgRating =
    totalCount > 0
      ? (allReviews.reduce((sum, item) => sum + item.rating, 0) / totalCount).toFixed(1)
      : "0.0";

  const filteredReviews =
    filter === "pending"
      ? allReviews.filter((item) => !item.approved)
      : filter === "approved"
        ? allReviews.filter((item) => item.approved)
        : allReviews;

  const starCounts = new Map<number, number>([
    [5, 0],
    [4, 0],
    [3, 0],
    [2, 0],
    [1, 0]
  ]);
  for (const row of allReviews) {
    starCounts.set(row.rating, (starCounts.get(row.rating) ?? 0) + 1);
  }
  const starRows = [5, 4, 3, 2, 1].map((stars) => {
    const count = starCounts.get(stars) ?? 0;
    const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
    return {
      key: String(stars),
      label: `${"★".repeat(stars)} (${stars}/5)`,
      value: count,
      displayValue: `${count} (${pct}%)`,
      color: stars >= 4 ? "#5E6D61" : stars === 3 ? "#C7924D" : "#B85A2D"
    };
  });

  const filterTabs: Array<{ key: "all" | "pending" | "approved"; label: string; count: number; href: string }> = [
    { key: "all", label: r.insights.tabs.all, count: totalCount, href: "/admin/reviews" },
    {
      key: "pending",
      label: r.insights.tabs.pending,
      count: pendingCount,
      href: "/admin/reviews?filter=pending"
    },
    {
      key: "approved",
      label: r.insights.tabs.approved,
      count: approvedCount,
      href: "/admin/reviews?filter=approved"
    }
  ];

  return (
    <AdminShell>
      <div>
        <p
          className={cn(
            "text-[11px] text-[#8C7A6B] font-medium mb-1",
            !isArabic && "uppercase tracking-[0.2em]"
          )}
        >
          {r.kicker}
        </p>
        <h1 className="font-editorial text-3xl sm:text-4xl font-black text-[#1C1917]">
          {r.title}
        </h1>
        <p className="mt-2 text-sm text-[#665E57] font-light">{r.subtitle}</p>
      </div>

      <KpiGrid
        items={[
          {
            key: "total",
            label: r.insights.totalReviews,
            value: totalCount,
            tone: "charcoal",
            icon: <MessageSquare size={15} aria-hidden />
          },
          {
            key: "avg",
            label: r.insights.avgRating,
            value: `${avgRating} / 5`,
            tone: "gold",
            icon: <Star size={15} aria-hidden />
          },
          {
            key: "pending",
            label: r.insights.pendingModeration,
            value: pendingCount,
            tone: pendingCount > 0 ? "terracotta" : "charcoal",
            icon: <Clock size={15} aria-hidden />,
            href: "/admin/reviews?filter=pending"
          },
          {
            key: "approved",
            label: r.insights.approvedCount,
            value: approvedCount,
            tone: "sage",
            icon: <CheckCircle2 size={15} aria-hidden />,
            href: "/admin/reviews?filter=approved"
          }
        ]}
      />

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <HorizontalBarCard
          maxOverride={Math.max(1, totalCount)}
          rows={starRows}
          title={r.insights.distributionTitle}
        />
        <SegmentedShareCard
          emptyLabel={r.empty}
          segments={[
            {
              key: "approved",
              label: r.insights.tabs.approved,
              count: approvedCount,
              color: "#5E6D61",
              href: "/admin/reviews?filter=approved"
            },
            {
              key: "pending",
              label: r.insights.tabs.pending,
              count: pendingCount,
              color: "#C7924D",
              href: "/admin/reviews?filter=pending"
            }
          ]}
          title={r.insights.pendingModeration}
          total={totalCount}
        />
      </section>

      <nav className="mt-6 flex flex-wrap items-center gap-2">
        {filterTabs.map((tab) => {
          const isCurrent = filter === tab.key;
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

      <div className="mt-5 grid gap-4">
        {filteredReviews.length === 0 ? (
          <p className="rounded-2xl border border-[#E5DDD0] bg-white p-6 text-sm text-[#78716C] font-light">
            {r.empty}
          </p>
        ) : (
          filteredReviews.map((review) => (
            <article
              className="grid gap-3 rounded-2xl border border-[#E5DDD0] bg-white p-5 sm:p-6 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]"
              key={review.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-editorial text-lg font-bold text-[#1C1917]">
                  {pickLocalized(locale, review.product.name, review.product.nameEn)} ·{" "}
                  {review.name} ·{" "}
                  <span className="text-[#C7924D]" dir="ltr">
                    {review.rating}/5
                  </span>
                </p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium border ${
                    review.approved
                      ? "border-[#CBD5C8] bg-[#E7ECE5] text-[#2F463B]"
                      : "border-[#E5DDD0] bg-[#FAF8F5] text-[#9E4A22]"
                  }`}
                >
                  {review.approved ? dict.common.approved : dict.common.pending}
                </span>
              </div>
              {review.title ? <p className="font-semibold text-[#1C1917]">{review.title}</p> : null}
              <p className="text-sm leading-relaxed text-[#665E57] font-light">{review.body}</p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {!review.approved ? (
                  <ActionForm action={approveReviewAction} submitLabel={r.approve}>
                    <input name="id" type="hidden" value={review.id} />
                  </ActionForm>
                ) : null}
                <DeleteButton action={deleteReviewAction} id={review.id} />
              </div>
            </article>
          ))
        )}
      </div>
    </AdminShell>
  );
}
