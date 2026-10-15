import { describe, expect, it } from "vitest";
import { calculateCouponDiscountCents, normalizeCouponCode } from "@/lib/coupons";
import { pickShippingCents } from "@/lib/shipping";

describe("coupons", () => {
  it("normalizes codes to uppercase without spaces", () => {
    expect(normalizeCouponCode("  welcome10 ")).toBe("WELCOME10");
  });

  it("calculates percent discounts floored to whole piasters", () => {
    expect(calculateCouponDiscountCents("PERCENT", 10, 25000)).toBe(2500);
    expect(calculateCouponDiscountCents("PERCENT", 10, 199)).toBe(19);
  });

  it("caps fixed discounts at the subtotal", () => {
    expect(calculateCouponDiscountCents("FIXED", 50, 3000)).toBe(3000);
    expect(calculateCouponDiscountCents("FIXED", 50, 10000)).toBe(5000);
  });

  it("returns zero for empty carts", () => {
    expect(calculateCouponDiscountCents("PERCENT", 10, 0)).toBe(0);
  });
});

describe("shipping", () => {
  const rates = new Map([["Cairo", 6500]]);

  it("uses the governorate rate when configured", () => {
    expect(
      pickShippingCents({ subtotalCents: 10000, governorate: "Cairo", rates, flatCents: 8000, thresholdCents: 0 })
    ).toBe(6500);
  });

  it("falls back to the flat rate for unknown governorates", () => {
    expect(
      pickShippingCents({ subtotalCents: 10000, governorate: "Sohag", rates, flatCents: 8000, thresholdCents: 0 })
    ).toBe(8000);
  });

  it("gives free shipping above the threshold", () => {
    expect(
      pickShippingCents({ subtotalCents: 200000, governorate: "Cairo", rates, flatCents: 8000, thresholdCents: 150000 })
    ).toBe(0);
  });
});
