import { Prisma } from "@prisma/client";

export type MoneyInput = string | number | Prisma.Decimal | { toString(): string };

export function toCents(value: MoneyInput): number {
  const normalized = value.toString().trim();
  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error(`Invalid money value: ${normalized}`);
  }

  const [whole, fraction = ""] = normalized.split(".");
  const sign = whole.startsWith("-") ? -1 : 1;
  const absWhole = whole.replace("-", "");
  const cents = Number(absWhole) * 100 + Number(fraction.padEnd(2, "0"));
  return cents * sign;
}

export function centsToDecimal(cents: number) {
  return new Prisma.Decimal((cents / 100).toFixed(2));
}

export function formatMoney(value: MoneyInput, currency = "EGP") {
  const amount = toCents(value) / 100;
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

export function addMoney(...values: MoneyInput[]) {
  return centsToDecimal(values.reduce<number>((sum, value) => sum + toCents(value), 0));
}
