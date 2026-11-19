import { createSizeAction, deleteSizeAction, updateSizeAction } from "@/app/actions/admin";
import { ActionForm } from "@/components/admin/action-form";
import { AdminShell } from "@/components/admin/admin-shell";
import { DeleteButton } from "@/components/admin/delete-button";
import { Field, Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function SizesPage() {
  await requireAdmin(PERMISSIONS.PRODUCTS_MANAGE);
  const sizes = await prisma.size.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });

  return (
    <AdminShell>
      <h1 className="text-3xl font-bold text-concrete-900">Sizes</h1>
      <p className="mt-2 text-concrete-600">
        Shared product sizes (for example 50g, 100g, 150g). Each product can pick a subset of them and
        set its own full price per size.
      </p>
      <div className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr]">
        <ActionForm action={createSizeAction} submitLabel="Create size">
          <Field label="Name">
            <Input name="name" placeholder="e.g. 100g" required />
          </Field>
          <Field label="Sort order">
            <Input defaultValue={0} name="sortOrder" type="number" />
          </Field>
          <label className="inline-flex items-center gap-2 text-sm font-semibold">
            <input className="h-5 w-5 accent-wahaj-teal" defaultChecked name="active" type="checkbox" />
            Active
          </label>
        </ActionForm>
        <div className="rounded-md border border-concrete-100 bg-white p-5 shadow-soft">
          <h2 className="text-xl font-bold text-concrete-900">Current sizes</h2>
          <div className="mt-4 grid gap-4">
            {sizes.length === 0 ? (
              <p className="text-sm text-concrete-500">
                No sizes yet. Create one on the left, then attach it to any product.
              </p>
            ) : null}
            {sizes.map((size) => (
              <details className="rounded-md bg-concrete-50 p-3" key={size.id}>
                <summary className="flex cursor-pointer items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-3">
                    <span className="font-semibold">{size.name}</span>
                  </span>
                  <span className="text-sm text-concrete-500">
                    {size.active ? "Active" : "Hidden"}
                  </span>
                </summary>
                <div className="mt-3 grid gap-3">
                  <ActionForm action={updateSizeAction} submitLabel="Save changes">
                    <input name="id" type="hidden" value={size.id} />
                    <div className="grid gap-3 md:grid-cols-3">
                      <Field label="Name">
                        <Input defaultValue={size.name} name="name" required />
                      </Field>
                      <Field label="Sort order">
                        <Input defaultValue={size.sortOrder} name="sortOrder" type="number" />
                      </Field>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm font-semibold">
                      <input
                        className="h-5 w-5 accent-wahaj-teal"
                        defaultChecked={size.active}
                        name="active"
                        type="checkbox"
                      />
                      Active
                    </label>
                  </ActionForm>
                  <DeleteButton action={deleteSizeAction} id={size.id} />
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
