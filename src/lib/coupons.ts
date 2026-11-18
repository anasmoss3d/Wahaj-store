import type { CouponType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { toCents, type MoneyInput } from "@/lib/money";

export function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
}

export function calculateCouponDiscountCents(
  type: CouponType,
  value: MoneyInput,
  subtotalCents: number
) {
  if (subtotalCents <= 0) return 0;
  if (type === "PERCENT") {
    const percent = Number(value.toString());
    if (!Number.isFinite(percent) || percent <= 0) return 0;
    return Math.min(subtotalCents, Math.floor((subtotalCents * percent) / 100));
  }
  return Math.min(subtotalCents, toCents(value));
}

export async function validateCouponForSubtotal(
  code: string,
  subtotalCents: number,
  client: Pick<typeof prisma, "coupon"> = prisma
) {
  const normalized = normalizeCouponCode(code);
  if (!normalized) throw new AppError("Enter a coupon code.");

  const coupon = await client.coupon.findUnique({ where: { code: normalized } });
  if (!coupon || !coupon.active) throw new AppError("This coupon is not valid.");
  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) throw new AppError("This coupon is not active yet.");
  if (coupon.endsAt && coupon.endsAt < now) throw new AppError("This coupon has expired.");
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    throw new AppError("This coupon has reached its usage limit.");
  }
  if (subtotalCents < toCents(coupon.minSubtotal)) {
    throw new AppError(`This coupon requires a minimum subtotal.`);
  }

  const discountCents = calculateCouponDiscountCents(coupon.type, coupon.value, subtotalCents);
  if (discountCents <= 0) throw new AppError("This coupon gives no discount on this cart.");
  return { coupon, discountCents };
}
