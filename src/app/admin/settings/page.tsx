import { Banknote, Gift, MapPin, Truck } from "lucide-react";
import { updateSettingsAction, upsertShippingRateAction } from "@/app/actions/admin";
import { ActionForm } from "@/components/admin/action-form";
import { HorizontalBarCard, KpiGrid } from "@/components/admin/admin-insights";
import { AdminShell } from "@/components/admin/admin-shell";
import { QrImageField } from "@/components/admin/qr-image-field";
import { Field, Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GOVERNORATES, governorateLabel } from "@/lib/governorates";
import { getAdminDictionary, getLocale } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { PERMISSIONS } from "@/lib/rbac";
import { getStoreSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireAdmin(PERMISSIONS.SETTINGS_MANAGE);
  const [locale, dict, settings, rates] = await Promise.all([
    getLocale(),
    getAdminDictionary(),
    getStoreSettings(),
    prisma.shippingRate.findMany({ orderBy: { governorate: "asc" } })
  ]);
  const isArabic = locale === "ar";
  const s = dict.settings;
  const ins = s.insights;
  const configured = new Map(rates.map((row) => [row.governorate, row]));

  const activeRates = rates.filter((row) => row.active);
  const activeAmounts = activeRates.map((row) => Number(row.rate));
  const avgRate =
    activeAmounts.length > 0
      ? Math.round(activeAmounts.reduce((sum, n) => sum + n, 0) / activeAmounts.length)
      : settings.shippingFlatRate;
  const minRate = activeAmounts.length > 0 ? Math.min(...activeAmounts) : settings.shippingFlatRate;
  const maxRate = activeAmounts.length > 0 ? Math.max(...activeAmounts) : settings.shippingFlatRate;

  const customRateRows = GOVERNORATES.filter((gov) => configured.has(gov)).map((governorate) => {
    const row = configured.get(governorate)!;
    const rateNum = Number(row.rate);
    return {
      key: governorate,
      label: governorateLabel(governorate, locale),
      sublabel: row.active ? dict.common.active : s.flatShippingRate,
      value: rateNum,
      displayValue: formatMoney(String(rateNum), "EGP", locale),
      color: row.active ? "#B85A2D" : "#C9BFA9"
    };
  });
  const rateChartRows = (
    customRateRows.length > 0
      ? [...customRateRows].sort((a, b) => b.value - a.value)
      : GOVERNORATES.slice(0, 5).map((governorate) => ({
          key: governorate,
          label: governorateLabel(governorate, locale),
          sublabel: s.flatShippingRate,
          value: settings.shippingFlatRate,
          displayValue: formatMoney(String(settings.shippingFlatRate), "EGP", locale),
          color: "#C9BFA9"
        }))
  );

  const channelChecks = [
    {
      label: ins.instapayLabel,
      ready: Boolean(settings.instapayHandle?.trim() || settings.instapayLink?.trim()),
      detail: settings.instapayHandle || settings.instapayLink || ins.missingLabel
    },
    {
      label: ins.qrLabel,
      ready: Boolean(settings.instapayQrImage?.trim()),
      detail: settings.instapayQrImage ? ins.readyLabel : ins.missingLabel
    },
    {
      label: ins.telegramLabel,
      ready: Boolean(settings.telegramChatId?.trim()),
      detail: settings.telegramChatId ? ins.readyLabel : ins.missingLabel
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
          {s.kicker}
        </p>
        <h1 className="font-editorial text-3xl sm:text-4xl font-black text-[#1C1917]">
          {s.title}
        </h1>
        <p className="mt-2 text-sm text-[#665E57] font-light">{s.subtitle}</p>
      </div>

      <KpiGrid
        items={[
          {
            key: "zones",
            label: ins.activeGovernorates,
            value: `${activeRates.length} / ${GOVERNORATES.length}`,
            tone: "sage",
            icon: <MapPin size={15} aria-hidden />
          },
          {
            key: "avgRate",
            label: ins.avgRate,
            value: formatMoney(String(avgRate), "EGP", locale),
            tone: "terracotta",
            icon: <Truck size={15} aria-hidden />
          },
          {
            key: "spread",
            label: ins.rateSpread,
            value:
              minRate === maxRate
                ? formatMoney(String(minRate), "EGP", locale)
                : `${minRate}–${maxRate}`,
            tone: "charcoal",
            icon: <Banknote size={15} aria-hidden />,
            detail: dict.common.egp
          },
          {
            key: "freeThreshold",
            label: ins.freeThreshold,
            value:
              settings.freeShippingThreshold > 0
                ? formatMoney(String(settings.freeShippingThreshold), "EGP", locale)
                : ins.disabledLabel,
            tone: "gold",
            icon: <Gift size={15} aria-hidden />
          }
        ]}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)] lg:items-start">
        <div className="grid min-w-0 gap-5">
          <div className="rounded-2xl border border-[#E5DDD0] bg-white p-5 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-editorial text-lg font-bold text-[#1C1917]">
                {ins.channelHealthTitle}
              </h2>
              <div className="inline-flex items-center gap-1.5 text-xs text-[#665E57]">
                <span>{ins.brandPaletteLabel}:</span>
                <span
                  className="h-4 w-4 rounded-full border border-[#DED7CB]"
                  style={{ backgroundColor: settings.primaryColor }}
                  title={settings.primaryColor}
                />
                <span
                  className="h-4 w-4 rounded-full border border-[#DED7CB]"
                  style={{ backgroundColor: settings.secondaryColor }}
                  title={settings.secondaryColor}
                />
              </div>
            </div>
            <div className="mt-3.5 grid gap-2 sm:grid-cols-3">
              {channelChecks.map((chk) => (
                <div
                  className="rounded-xl border border-[#EDE8E0] bg-[#FAF8F5] px-3 py-2.5 text-xs"
                  key={chk.label}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-[#1C1917]">{chk.label}</span>
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        chk.ready ? "bg-[#2F463B]" : "bg-[#C7924D]"
                      )}
                    />
                  </div>
                  <p className="mt-1 truncate text-[#78716C] font-light" dir="ltr">
                    {chk.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <ActionForm action={updateSettingsAction} submitLabel={s.saveSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={s.flatShippingRate}>
                <Input
                  defaultValue={settings.shippingFlatRate}
                  dir="ltr"
                  name="shippingFlatRate"
                  type="number"
                />
              </Field>
              <Field label={s.freeShippingThreshold}>
                <Input
                  defaultValue={settings.freeShippingThreshold}
                  dir="ltr"
                  name="freeShippingThreshold"
                  type="number"
                />
              </Field>
            </div>
            <Field label={s.whatsappNumber}>
              <Input defaultValue={settings.whatsappNumber} dir="ltr" name="whatsappNumber" />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={s.primaryColor}>
                <Input defaultValue={settings.primaryColor} name="primaryColor" type="color" />
              </Field>
              <Field label={s.secondaryColor}>
                <Input defaultValue={settings.secondaryColor} name="secondaryColor" type="color" />
              </Field>
            </div>
            <Field label={s.heroImage}>
              <Input defaultValue={settings.heroImage} dir="ltr" name="heroImage" />
            </Field>
            <Field label={s.contactEmail}>
              <Input defaultValue={settings.contactEmail} dir="ltr" name="contactEmail" type="email" />
            </Field>
            <Field label={s.instapayHandle}>
              <Input defaultValue={settings.instapayHandle} name="instapayHandle" dir="ltr" />
            </Field>
            <Field label={s.instapayLink}>
              <Input
                defaultValue={settings.instapayLink}
                name="instapayLink"
                dir="ltr"
                placeholder="https://ipn.eg/..."
                type="url"
              />
            </Field>
            <QrImageField initial={settings.instapayQrImage} />
            <Field label={s.telegramChatId}>
              <Input
                defaultValue={settings.telegramChatId}
                name="telegramChatId"
                dir="ltr"
                placeholder="e.g. 123456789"
              />
            </Field>
          </ActionForm>
        </div>

        <div className="grid min-w-0 gap-5">
          <HorizontalBarCard rows={rateChartRows} title={ins.shippingChartTitle} />

          <div className="min-w-0 rounded-2xl border border-[#E5DDD0] bg-white p-5 sm:p-6 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]">
            <h2 className="font-editorial text-2xl font-black text-[#1C1917]">
              {s.shippingByGovernorate}
            </h2>
            <p className="mt-1 text-sm text-[#665E57] font-light">{s.shippingByGovernorateHint}</p>
            <div className="mt-4 grid gap-3">
              {GOVERNORATES.map((governorate) => (
                <ShippingRow
                  active={configured.get(governorate)?.active ?? false}
                  activeLabel={dict.common.active}
                  displayName={governorateLabel(governorate, locale)}
                  governorate={governorate}
                  key={governorate}
                  locale={locale}
                  rate={
                    configured.get(governorate) ? String(configured.get(governorate)!.rate) : ""
                  }
                  rateLabel={s.rate}
                  submitLabel={s.saveRate}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function ShippingRow({
  governorate,
  displayName,
  rate,
  active,
  locale,
  submitLabel,
  rateLabel,
  activeLabel
}: {
  governorate: string;
  displayName: string;
  rate: string;
  active: boolean;
  locale: "ar" | "en";
  submitLabel: string;
  rateLabel: string;
  activeLabel: string;
}) {
  return (
    <ActionForm action={upsertShippingRateAction} submitLabel={submitLabel}>
      <input name="governorate" type="hidden" value={governorate} />
      <div className="grid items-end gap-3 md:grid-cols-[1fr_140px_120px_auto]">
        <p className="font-semibold text-[#1C1917]">
          {displayName}
          {rate ? (
            <span className="ms-2 text-sm font-normal text-[#78716C]">
              {formatMoney(rate, "EGP", locale)}
            </span>
          ) : null}
        </p>
        <Field label={rateLabel}>
          <Input defaultValue={rate} dir="ltr" min="0" name="rate" type="number" />
        </Field>
        <label className="inline-flex items-center gap-2 pb-2 text-sm font-medium text-[#1C1917]">
          <input
            className="h-5 w-5 rounded accent-[#B85A2D]"
            defaultChecked={active}
            name="active"
            type="checkbox"
          />
          <span>{activeLabel}</span>
        </label>
        <span />
      </div>
    </ActionForm>
  );
}
