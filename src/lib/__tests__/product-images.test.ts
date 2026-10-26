import { describe, expect, it } from "vitest";
import { getProductColorImageUrl, getProductMainImageUrl } from "@/lib/product-images";

describe("product image mapping", () => {
  it("uses the prepared photo for each ribbed vase color", () => {
    expect(getProductColorImageUrl("Vase", "Blush Pink", "/old-pink.webp")).toBe(
      "/products/vases/blush-pink.webp"
    );
    expect(getProductColorImageUrl("Vase", "Soft Beige", "/old-beige.webp")).toBe(
      "/products/vases/soft-beige.webp"
    );
    expect(getProductColorImageUrl("Vase", "Warm White", "/old-white.webp")).toBe(
      "/products/vases/warm-white.webp"
    );
    expect(getProductColorImageUrl("Vase", "Concrete Gray", "/old-gray.webp")).toBe(
      "/products/vases/concrete-gray.webp"
    );
    expect(getProductColorImageUrl("Vase", "Custom Color", "/old-custom.webp")).toBe(
      "/products/vases/color-options.webp"
    );
  });

  it("normalizes vase slugs and color names", () => {
    expect(getProductColorImageUrl(" vase ", "  BLUSH   PINK ", "/old.webp")).toBe(
      "/products/vases/blush-pink.webp"
    );
  });

  it("keeps configured photos for other products and unknown colors", () => {
    expect(getProductColorImageUrl("tray", "Blush Pink", "/tray.webp")).toBe("/tray.webp");
    expect(getProductColorImageUrl("Vase", "Lavender", "/lavender.webp")).toBe(
      "/lavender.webp"
    );
  });

  it("uses the prepared pink photo on vase product cards", () => {
    expect(getProductMainImageUrl("Vase", "/old-main.webp")).toBe(
      "/products/vases/blush-pink.webp"
    );
    expect(getProductMainImageUrl("tray", "/tray.webp")).toBe("/tray.webp");
  });
});
