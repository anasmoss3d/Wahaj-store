import { updateSettingsAction, upsertShippingRateAction } from "@/app/actions/admin";
import { ActionForm } from "@/components/admin/action-form";
import { AdminShell } from "@/components/admin/admin-shell";
import { QrImageField } from "@/components/admin/qr-image-field";
import { Field, Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth";
import { GOVERNORATES } from "@/lib/governorates";
import { formatMoney } from "@/lib/money";
import { PERMISSIONS } from "@/lib/rbac";
import { getStoreSettings } from "@/lib/settings";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireAdmin(PERMISSIONS.SETTINGS_MANAGE);
  const [settings, rates] = await Promise.all([
    getStoreSettings(),
    prisma.shippingRate.findMany({ orderBy: { governorate: "asc" } })
  ]);
  const configured = new Map(rates.map((row) => [row.governorate, row]));

  return (
    <AdminShell>
      <h1 className="text-3xl font-bold text-concrete-900">Store settings</h1>
      <p className="mt-2 text-concrete-600">Theme, shipping, social, and contact details are stored in the database.</p>
      <div className="mt-8 grid max-w-2xl gap-6">
        <ActionForm action={updateSettingsAction} submitLabel="Save settings">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Flat shipping rate (fallback)">
              <Input defaultValue={settings.shippingFlatRate} name="shippingFlatRate" type="number" />
            </Field>
            <Field label="Free shipping threshold (0 = disabled)">
              <Input defaultValue={settings.freeShippingThreshold} name="freeShippingThreshold" type="number" />
            </Field>
          </div>
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
          <Field label="InstaPay handle (e.g. name@instapay)">
            <Input defaultValue={settings.instapayHandle} name="instapayHandle" dir="ltr" />
          </Field>
          <Field label="InstaPay payment link (tap-to-pay)">
            <Input defaultValue={settings.instapayLink} name="instapayLink" dir="ltr" placeholder="https://ipn.eg/..." type="url" />
          </Field>
          <QrImageField initial={settings.instapayQrImage} />
          <Field label="Telegram chat ID for order alerts (bot token goes in TELEGRAM_BOT_TOKEN env)">
            <Input defaultValue={settings.telegramChatId} name="telegramChatId" dir="ltr" placeholder="e.g. 123456789" />
          </Field>
        </ActionForm>

        <div className="rounded-md border border-concrete-100 bg-white p-5 shadow-soft">
          <h2 className="text-xl font-bold text-concrete-900">Shipping by governorate</h2>
          <p className="mt-1 text-sm text-concrete-600">
            Orders use the matching rate, otherwise the flat fallback. Free shipping threshold applies first.
          </p>
          <div className="mt-2 grid gap-3">
            {GOVERNORATES.map((governorate) => (
              <ShippingRow
                active={configured.get(governorate)?.active ?? false}
                governorate={governorate}
                key={governorate}
                rate={configured.get(governorate) ? String(configured.get(governorate)!.rate) : ""}
              />
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function ShippingRow({
  governorate,
  rate,
  active
}: {
  governorate: string;
  rate: string;
  active: boolean;
}) {
  return (
    <ActionForm action={upsertShippingRateAction} submitLabel="Save rate">
      <input name="governorate" type="hidden" value={governorate} />
      <div className="grid items-end gap-3 md:grid-cols-[1fr_140px_120px_auto]">
        <p className="font-semibold text-concrete-900">
          {governorate}
          {rate ? (
            <span className="ms-2 text-sm font-normal text-concrete-500">{formatMoney(rate)}</span>
          ) : null}
        </p>
        <Field label="Rate">
          <Input defaultValue={rate} min="0" name="rate" type="number" />
        </Field>
        <label className="inline-flex items-center gap-2 pb-2 text-sm font-semibold">
          <input className="h-5 w-5 accent-wahaj-teal" defaultChecked={active} name="active" type="checkbox" />
          Active
        </label>
        <span />
      </div>
    </ActionForm>
  );
}
