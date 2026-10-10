import type { MoneyInput } from "@/lib/money";
import { centsToDecimal, toCents } from "@/lib/money";

export type PriceSelection = {
  basePrice: MoneyInput;
  colorAdditionalPrice: MoneyInput;
  addonPrices: MoneyInput[];
  quantity: number;
};

export const ORDER_STATUS_FLOW = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "SHIPPED",
  "DELIVERED"
] as const;

export function calculateUnitPriceCents(selection: Omit<PriceSelection, "quantity">) {
  return (
    toCents(selection.basePrice) +
    toCents(selection.colorAdditionalPrice) +
    selection.addonPrices.reduce<number>((sum, price) => sum + toCents(price), 0)
  );
}

export function calculateLinePrice(selection: PriceSelection) {
  if (!Number.isInteger(selection.quantity) || selection.quantity < 1) {
    throw new Error("Quantity must be a positive integer.");
  }

  const unitCents = calculateUnitPriceCents(selection);
  return {
    unitPrice: centsToDecimal(unitCents),
    total: centsToDecimal(unitCents * selection.quantity),
    unitCents,
    totalCents: unitCents * selection.quantity
  };
}

export function cartItemSignature(
  productId: string,
  productColorId: string,
  productAddonIds: string[]
) {
  return [productId, productColorId, ...productAddonIds.slice().sort()].join(":");
}

export function canMoveOrderStatus(from: string, to: string) {
  if (to === "CANCELLED") return from !== "DELIVERED";
  if (from === "CANCELLED") return false;

  const fromIndex = ORDER_STATUS_FLOW.indexOf(from as (typeof ORDER_STATUS_FLOW)[number]);
  const toIndex = ORDER_STATUS_FLOW.indexOf(to as (typeof ORDER_STATUS_FLOW)[number]);
  return fromIndex >= 0 && toIndex >= 0 && toIndex >= fromIndex;
}
