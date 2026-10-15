import { deleteCouponAction, upsertCouponAction } from "@/app/actions/admin";
import { ActionForm } from "@/components/admin/action-form";
import { AdminShell } from "@/components/admin/admin-shell";
import { DeleteButton } from "@/components/admin/delete-button";
import { Field, Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { PERMISSIONS } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function CouponsPage() {
  await requireAdmin(PERMISSIONS.MARKETING_MANAGE);
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <AdminShell>
      <h1 className="text-3xl font-bold text-concrete-900">Coupons</h1>
      <p className="mt-2 text-concrete-600">
        Percent or fixed discounts validated server-side at checkout. Usage is counted on order creation.
      </p>
      <div className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr]">
        <ActionForm action={upsertCouponAction} submitLabel="Create coupon">
          <Field label="Code">
            <Input name="code" placeholder="WELCOME10" required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select className="min-h-11 rounded-md border border-concrete-200 px-3" name="type">
                <option value="PERCENT">Percent %</option>
                <option value="FIXED">Fixed EGP</option>
              </select>
            </Field>
            <Field label="Value">
              <Input min="0" name="value" required type="number" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Min subtotal">
              <Input defaultValue={0} min="0" name="minSubtotal" type="number" />
            </Field>
            <Field label="Max uses (empty = unlimited)">
              <Input min="1" name="maxUses" type="number" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starts at">
              <Input name="startsAt" type="date" />
            </Field>
            <Field label="Ends at">
              <Input name="endsAt" type="date" />
            </Field>
          </div>
          <label className="inline-flex items-center gap-2 text-sm font-semibold">
            <input className="h-5 w-5 accent-wahaj-teal" defaultChecked name="active" type="checkbox" />
            Active
          </label>
        </ActionForm>
        <div className="rounded-md border border-concrete-100 bg-white p-5 shadow-soft">
          <h2 className="text-xl font-bold text-concrete-900">Current coupons</h2>
          <div className="mt-4 grid gap-4">
            {coupons.map((coupon) => (
              <details className="rounded-md bg-concrete-50 p-3" key={coupon.id}>
                <summary className="flex cursor-pointer items-center justify-between gap-3">
                  <span>
                    <span className="block font-bold">{coupon.code}</span>
                    <span className="text-sm text-concrete-500">
                      {coupon.type === "PERCENT" ? `${coupon.value}%` : formatMoney(coupon.value)} · min{" "}
                      {formatMoney(coupon.minSubtotal)} · used {coupon.usedCount}
                      {coupon.maxUses ? `/${coupon.maxUses}` : ""}
                    </span>
                  </span>
                  <span className="text-sm">{coupon.active ? "Active" : "Inactive"}</span>
                </summary>
                <div className="mt-3 grid gap-3">
                  <ActionForm action={upsertCouponAction} submitLabel="Save changes">
                    <input name="id" type="hidden" value={coupon.id} />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Code">
                        <Input defaultValue={coupon.code} name="code" required />
                      </Field>
                      <Field label="Type">
                        <select
                          className="min-h-11 rounded-md border border-concrete-200 px-3"
                          defaultValue={coupon.type}
                          name="type"
                        >
                          <option value="PERCENT">Percent %</option>
                          <option value="FIXED">Fixed EGP</option>
                        </select>
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Value">
                        <Input defaultValue={String(coupon.value)} min="0" name="value" required type="number" />
                      </Field>
                      <Field label="Min subtotal">
                        <Input defaultValue={String(coupon.minSubtotal)} min="0" name="minSubtotal" type="number" />
                      </Field>
                    </div>
                    <Field label="Max uses (empty = unlimited)">
                      <Input defaultValue={coupon.maxUses ?? ""} min="1" name="maxUses" type="number" />
                    </Field>
                    <label className="inline-flex items-center gap-2 text-sm font-semibold">
                      <input
                        className="h-5 w-5 accent-wahaj-teal"
                        defaultChecked={coupon.active}
                        name="active"
                        type="checkbox"
                      />
                      Active
                    </label>
                  </ActionForm>
                  <DeleteButton action={deleteCouponAction} id={coupon.id} />
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
