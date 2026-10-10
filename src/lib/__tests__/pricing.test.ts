import { describe, expect, it } from "vitest";
import {
  calculateLinePrice,
  calculateUnitPriceCents,
  canMoveOrderStatus,
  cartItemSignature
} from "@/lib/pricing";

describe("pricing", () => {
  it("calculates unit and subtotal from base price, color, add-ons, and quantity", () => {
    const price = calculateLinePrice({
      basePrice: "250.00",
      colorAdditionalPrice: "15",
      addonPrices: ["30", "20"],
      quantity: 2
    });

    expect(price.unitCents).toBe(31500);
    expect(price.totalCents).toBe(63000);
    expect(price.unitPrice.toString()).toBe("315");
    expect(price.total.toString()).toBe("630");
  });

  it("rejects invalid quantities", () => {
    expect(() =>
      calculateLinePrice({
        basePrice: 250,
        colorAdditionalPrice: 0,
        addonPrices: [],
        quantity: 0
      })
    ).toThrow("Quantity must be a positive integer.");
  });

  it("calculates unit cents without trusting a client total", () => {
    expect(
      calculateUnitPriceCents({
        basePrice: "450",
        colorAdditionalPrice: "15",
        addonPrices: ["30", "25"]
      })
    ).toBe(52000);
  });

  it("keeps cart item identity tied to customization", () => {
    expect(cartItemSignature("p1", "black", ["gold", "stones"])).toBe(
      cartItemSignature("p1", "black", ["stones", "gold"])
    );
    expect(cartItemSignature("p1", "black", ["gold"])).not.toBe(
      cartItemSignature("p1", "white", ["gold"])
    );
  });

  it("allows forward order status movement and cancellation before delivery", () => {
    expect(canMoveOrderStatus("PENDING", "CONFIRMED")).toBe(true);
    expect(canMoveOrderStatus("CONFIRMED", "PENDING")).toBe(false);
    expect(canMoveOrderStatus("PREPARING", "CANCELLED")).toBe(true);
    expect(canMoveOrderStatus("DELIVERED", "CANCELLED")).toBe(false);
  });
});
