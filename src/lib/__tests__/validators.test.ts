import { describe, expect, it } from "vitest";
import { addToCartSchema, checkoutSchema, orderStatusInputSchema } from "@/lib/validators";

describe("validators", () => {
  it("accepts a valid customized cart item", () => {
    const parsed = addToCartSchema.parse({
      productId: "clzzzzzz00001abc",
      productColorId: "clzzzzzz00002abc",
      productAddonIds: ["clzzzzzz00003abc"],
      quantity: 2
    });

    expect(parsed.quantity).toBe(2);
  });

  it("rejects cart quantities outside supported range", () => {
    expect(() =>
      addToCartSchema.parse({
        productId: "clzzzzzz00001abc",
        productColorId: "clzzzzzz00002abc",
        productAddonIds: [],
        quantity: 100
      })
    ).toThrow();
  });

  it("validates checkout phone and address fields", () => {
    const parsed = checkoutSchema.parse({
      customerName: "Mona Ali",
      phone: "01012345678",
      whatsapp: "",
      email: "",
      governorate: "Cairo",
      city: "Nasr City",
      fullAddress: "Building 10, Street 20",
      building: "",
      notes: "Call before delivery"
    });

    expect(parsed.phone).toBe("01012345678");
  });

  it("rejects unknown order statuses", () => {
    expect(() => orderStatusInputSchema.parse({ status: "RETURNED", note: "" })).toThrow();
  });
});
