import { describe, expect, it } from "vitest";
import {
  adminProductSchema,
  addToCartSchema,
  checkoutSchema,
  loginSchema,
  orderStatusInputSchema,
  registerSchema,
  resetPasswordConfirmSchema,
  resetPasswordRequestSchema
} from "@/lib/validators";

const adminProductBase = {
  name: "Strawberry Candles",
  description: "A handpoured strawberry milk candle by Wahaj.",
  basePrice: "230",
  categoryId: "clzzzzzz00001cat",
  mainImage: "https://example.com/main.webp",
  sku: "Candles 1002",
  stockQuantity: 1,
  active: true,
  featured: true,
  bestSeller: true,
  sortOrder: 0,
  seoTitle: "",
  metaDescription: "",
  canonicalUrl: "",
  gallery: [],
  colors: [],
  addonIds: []
};

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

  it("accepts cart items without a color for no-color products", () => {
    expect(
      addToCartSchema.parse({
        productId: "clzzzzzz00001abc",
        productColorId: null,
        productAddonIds: [],
        quantity: 1
      }).productColorId
    ).toBeNull();
    expect(
      addToCartSchema.parse({
        productId: "clzzzzzz00001abc",
        productColorId: "",
        quantity: 1
      }).productColorId
    ).toBeNull();
    expect(addToCartSchema.parse({ productId: "clzzzzzz00001abc", quantity: 1 }).productColorId).toBeNull();
  });

  it("saves an admin product with no colors and no slug", () => {
    const parsed = adminProductSchema.parse(adminProductBase);
    expect(parsed.colors).toEqual([]);
    expect(parsed.addonIds).toEqual([]);
    expect(parsed.slug).toBeUndefined();
  });

  it("accepts an explicit admin slug and colored products as before", () => {
    const parsed = adminProductSchema.parse({
      ...adminProductBase,
      slug: "candles-1002",
      colors: [
        {
          colorId: "clzzzzzz00004col",
          additionalPrice: "0",
          imageUrl: "https://example.com/white.webp",
          active: true,
          sortOrder: 0
        }
      ]
    });
    expect(parsed.slug).toBe("candles-1002");
    expect(parsed.colors).toHaveLength(1);
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

  it("accepts unified login via email or Egyptian mobile number without password length oracle", () => {
    expect(
      loginSchema.parse({
        identifier: "admin@wahaj.local",
        password: "x"
      }).identifier
    ).toBe("admin@wahaj.local");

    expect(
      loginSchema.parse({
        identifier: "01012345678",
        password: "password123"
      }).identifier
    ).toBe("01012345678");

    expect(
      loginSchema.parse({
        identifier: "+201012345678",
        password: "password123"
      }).identifier
    ).toBe("+201012345678");
  });

  it("rejects invalid login identifiers", () => {
    expect(() =>
      loginSchema.parse({
        identifier: "not-an-email-or-phone",
        password: "password123"
      })
    ).toThrow();
  });

  it("validates registration email optionality and bcrypt 72-byte limit", () => {
    const parsed = registerSchema.parse({
      name: "Mona Ali",
      phone: "01012345678",
      email: "",
      password: "password123"
    });
    expect(parsed.phone).toBe("01012345678");
    expect(parsed.email).toBe("");

    expect(() =>
      registerSchema.parse({
        name: "Mona Ali",
        phone: "01012345678",
        email: "",
        password: "é".repeat(40)
      })
    ).toThrow();
  });

  it("validates password reset request and confirm schemas", () => {
    expect(
      resetPasswordRequestSchema.parse({ email: "  User@Example.com " }).email
    ).toBe("User@Example.com");

    expect(
      resetPasswordConfirmSchema.parse({
        token: "abcdefghijklmnopqrstuvwxyz1234",
        password: "newpassword123",
        confirmPassword: "newpassword123"
      }).token
    ).toBe("abcdefghijklmnopqrstuvwxyz1234");

    expect(() =>
      resetPasswordConfirmSchema.parse({
        token: "abcdefghijklmnopqrstuvwxyz1234",
        password: "newpassword123",
        confirmPassword: "differentpassword"
      })
    ).toThrow();
  });
});
