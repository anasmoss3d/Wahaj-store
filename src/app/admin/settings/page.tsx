import { updateSettingsAction } from "@/app/actions/admin";
import { ActionForm } from "@/components/admin/action-form";
import { AdminShell } from "@/components/admin/admin-shell";
import { Field, Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { getStoreSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireAdmin(PERMISSIONS.SETTINGS_MANAGE);
  const settings = await getStoreSettings();

  return (
    <AdminShell>
      <h1 className="text-3xl font-bold text-concrete-900">Store settings</h1>
      <p className="mt-2 text-concrete-600">Theme, shipping, social, and contact details are stored in the database.</p>
      <div className="mt-8 max-w-2xl">
        <ActionForm action={updateSettingsAction} submitLabel="Save settings">
          <Field label="Flat shipping rate">
            <Input defaultValue={settings.shippingFlatRate} name="shippingFlatRate" type="number" />
          </Field>
          <Field label="WhatsApp number">
            <Input defaultValue={settings.whatsappNumber} name="whatsappNumber" />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Primary color">
              <Input defaultValue={settings.primaryColor} name="primaryColor" type="color" />
            </Field>
            <Field label="Secondary color">
              <Input defaultValue={settings.secondaryColor} name="secondaryColor" type="color" />
            </Field>
          </div>
          <Field label="Homepage hero image">
            <Input defaultValue={settings.heroImage} name="heroImage" />
          </Field>
          <Field label="Contact email">
            <Input defaultValue={settings.contactEmail} name="contactEmail" type="email" />
          </Field>
        </ActionForm>
      </div>
    </AdminShell>
  );
}
