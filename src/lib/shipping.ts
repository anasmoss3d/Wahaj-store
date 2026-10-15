import { prisma } from "@/lib/db";
import { toCents } from "@/lib/money";
import { getStoreSettings } from "@/lib/settings";

export function pickShippingCents(input: {
  subtotalCents: number;
  governorate?: string | null;
  rates: Map<string, number>;
  flatCents: number;
  thresholdCents: number;
}) {
  if (input.thresholdCents > 0 && input.subtotalCents >= input.thresholdCents) return 0;
  if (input.governorate && input.rates.has(input.governorate)) {
    return input.rates.get(input.governorate) ?? input.flatCents;
  }
  return input.flatCents;
}

export async function getActiveShippingRates() {
  return prisma.shippingRate.findMany({
    where: { active: true },
    orderBy: { governorate: "asc" }
  });
}

export async function resolveShippingCents(governorate: string | null, subtotalCents: number) {
  const [settings, rates] = await Promise.all([getStoreSettings(), getActiveShippingRates()]);
  const rateMap = new Map(rates.map((row) => [row.governorate, toCents(row.rate)]));
  return pickShippingCents({
    subtotalCents,
    governorate,
    rates: rateMap,
    flatCents: toCents(String(settings.shippingFlatRate)),
    thresholdCents: toCents(String(settings.freeShippingThreshold))
  });
}
