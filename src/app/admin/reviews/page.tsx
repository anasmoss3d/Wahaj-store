import { approveReviewAction, deleteReviewAction } from "@/app/actions/admin";
import { ActionForm } from "@/components/admin/action-form";
import { AdminShell } from "@/components/admin/admin-shell";
import { DeleteButton } from "@/components/admin/delete-button";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  await requireAdmin(PERMISSIONS.PRODUCTS_MANAGE);
  const reviews = await prisma.review.findMany({
    include: { product: true },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return (
    <AdminShell>
      <h1 className="text-3xl font-bold text-concrete-900">Reviews</h1>
      <p className="mt-2 text-concrete-600">Customer reviews need approval before appearing on product pages.</p>
      <div className="mt-8 grid gap-4">
        {reviews.length === 0 ? (
          <p className="rounded-md border border-concrete-100 bg-white p-5 text-sm text-concrete-600">
            No reviews yet.
          </p>
        ) : (
          reviews.map((review) => (
            <article
              className="grid gap-3 rounded-md border border-concrete-100 bg-white p-5 shadow-soft"
              key={review.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold text-concrete-900">
                  {review.product.name} · {review.name} · {review.rating}/5
                </p>
                <span className="text-sm">{review.approved ? "Approved" : "Pending"}</span>
              </div>
              {review.title ? <p className="font-semibold">{review.title}</p> : null}
              <p className="text-sm leading-7 text-concrete-600">{review.body}</p>
              <div className="flex flex-wrap gap-2">
                {!review.approved ? (
                  <ActionForm action={approveReviewAction} submitLabel="Approve">
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
