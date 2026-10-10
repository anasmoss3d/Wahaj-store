import { createColorAction } from "@/app/actions/admin";
import { ActionForm } from "@/components/admin/action-form";
import { AdminShell } from "@/components/admin/admin-shell";
import { Field, Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function ColorsPage() {
  await requireAdmin(PERMISSIONS.PRODUCTS_MANAGE);
  const colors = await prisma.color.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });

  return (
    <AdminShell>
      <h1 className="text-3xl font-bold text-concrete-900">Colors</h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr]">
        <ActionForm action={createColorAction} submitLabel="Create color">
          <Field label="Name">
            <Input name="name" required />
          </Field>
          <Field label="Hex code">
            <Input defaultValue="#f4f0e8" name="hexCode" required />
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
          <h2 className="text-xl font-bold text-concrete-900">Current colors</h2>
          <div className="mt-4 grid gap-3">
            {colors.map((color) => (
              <div className="flex items-center justify-between rounded-md bg-concrete-50 p-3" key={color.id}>
                <span className="inline-flex items-center gap-3">
                  <span className="h-6 w-6 rounded-full border" style={{ background: color.hexCode }} />
                  <span className="font-semibold">{color.name}</span>
                </span>
                <span className="text-sm">{color.hexCode}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
