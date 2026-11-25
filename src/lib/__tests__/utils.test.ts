import { describe, expect, it } from "vitest";
import { isCustomColorName, pickLocalized } from "@/lib/dictionary";
import { asciiSlug, SKU_SUGGESTED, skuStem, suggestedProductSku, suggestProductSlug } from "@/lib/utils";

describe("asciiSlug", () => {
  it("keeps Latin letters, numbers, and separators", () => {
    expect(asciiSlug("Warm   White 2")).toBe("warm-white-2");
    expect(asciiSlug("Candles-1002")).toBe("candles-1002");
    expect(asciiSlug("Café Noir")).toBe("cafe-noir");
  });

  it("trims and collapses runs of separators", () => {
    expect(asciiSlug("  --Hello, World!!  ")).toBe("hello-world");
  });

  it("returns empty for Arabic-only input so the SKU can be used", () => {
    expect(asciiSlug("شمعة الفراولة باللبن")).toBe("");
  });

  it("caps the length", () => {
    expect(asciiSlug(`a${"b".repeat(300)}`)).toHaveLength(180);
  });
});

describe("suggestProductSlug", () => {
  it("prefers an ASCII name", () => {
    expect(suggestProductSlug("Ribbed Vase", "Vases 001")).toBe("ribbed-vase");
  });

  it("falls back to the ASCII SKU for Arabic names", () => {
    expect(suggestProductSlug("شمعة الفراولة باللبن", "Candles 1002")).toBe("candles-1002");
  });

  it("uses a product-... fallback when name and SKU are empty", () => {
    const slug = suggestProductSlug("", "");
    expect(slug).toMatch(/^product-\d+$/);
  });
});

describe("skuStem", () => {
  it("compacts a Latin name to uppercase letters and caps at 14", () => {
    expect(skuStem("White Luxe Tray 40")).toBe("WHITELUXETRAY4");
    expect(skuStem("Extraordinary Deluxe Concrete Collection Table")).toBe("EXTRAORDINARYD");
  });

  it("falls back to WAH for Arabic-only names", () => {
    expect(skuStem("شمعة الفراولة باللبن")).toBe("WAH");
    expect(skuStem("  ")).toBe("WAH");
  });
});

describe("suggestedProductSku", () => {
  it("builds a WAH-STEM-### preview from the name", () => {
    expect(suggestedProductSku("White Luxe Tray 40")).toBe("WAH-WHITELUXETRAY4-315");
  });
  // The counter is a stable hash of the exact name, so the preview is only
  // illustrative — uniqueness is guaranteed server-side at save time.
  it("uses the generic stem for empty or Arabic-only names", () => {
    expect(suggestedProductSku("")).toBe(`${SKU_SUGGESTED}-000`);
    expect(suggestedProductSku("شمعة الفراولة باللبن")).toBe("WAH-WAH-927");
  });

  it("prefers English secondary name for slug/SKU when primary name is Arabic", () => {
    expect(suggestProductSlug("شمعة اللافندر", "", "Lavender Soy Candle")).toBe("lavender-soy-candle");
    expect(suggestedProductSku("شمعة اللافندر", "Lavender Soy Candle")).toMatch(/^WAH-LAVENDERSOYCAN-\d{3}$/);
  });
});

describe("bilingual localization helpers", () => {
  it("resolves primary Arabic or secondary English fields with fallback", () => {
    expect(pickLocalized("ar", "شمعة اللافندر", "Lavender Candle")).toBe("شمعة اللافندر");
    expect(pickLocalized("en", "شمعة اللافندر", "Lavender Candle")).toBe("Lavender Candle");
    expect(pickLocalized("en", "شمعة اللافندر", null)).toBe("شمعة اللافندر");
    expect(pickLocalized("ar", "", "Lavender Candle")).toBe("Lavender Candle");
  });

  it("matches custom color labels in both languages", () => {
    expect(isCustomColorName("لون مخصص", "Custom Color")).toBe(true);
    expect(isCustomColorName("لون مخصص", null)).toBe(true);
    expect(isCustomColorName("أبيض دافئ", "Warm White")).toBe(false);
  });
});
