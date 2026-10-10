import { createAddonAction } from "@/app/actions/admin";
import { ActionForm } from "@/components/admin/action-form";
import { AdminShell } from "@/components/admin/admin-shell";
import { Field, Input, Textarea } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { PERMISSIONS } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function AddonsPage() {
  await requireAdmin(PERMISSIONS.PRODUCTS_MANAGE);
  const addons = await prisma.addon.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });

  return (
    <AdminShell>
      <h1 className="text-3xl font-bold text-concrete-900">Add-ons</h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr]">
        <ActionForm action={createAddonAction} submitLabel="Create add-on">
          <Field label="Name">
            <Input name="name" required />
          </Field>
          <Field label="Description">
            <Textarea name="description" />
          </Field>
          <Field label="Price">
            <Input defaultValue={0} min="0" name="price" type="number" />
          </Field>
          <Field label="Image URL">
            <Input name="imageUrl" />
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
          <h2 className="text-xl font-bold text-concrete-900">Current add-ons</h2>
          <div className="mt-4 grid gap-3">
            {addons.map((addon) => (
              <div className="flex justify-between rounded-md bg-concrete-50 p-3" key={addon.id}>
                <span>
                  <span className="block font-semibold">{addon.name}</span>
                  <span className="text-sm text-concrete-500">{addon.description}</span>
                </span>
                <span className="text-sm font-semibold">{formatMoney(addon.price)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
