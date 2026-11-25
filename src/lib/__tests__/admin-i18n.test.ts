import { describe, expect, it } from "vitest";
import { adminAr, adminEn, getAdminRoleLabel, interpolate } from "@/lib/admin-i18n";
import { GOVERNORATES, governorateLabel } from "@/lib/governorates";
import { statusLabels } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";

function collectLeafPaths(obj: Record<string, unknown>, prefix = ""): string[] {
  const paths: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      paths.push(...collectLeafPaths(value as Record<string, unknown>, path));
    } else {
      paths.push(path);
    }
  }
  return paths.sort();
}

describe("admin localization", () => {
  it("has identical translation key coverage in Arabic and English dictionaries", () => {
    const enPaths = collectLeafPaths(adminEn);
    const arPaths = collectLeafPaths(adminAr);
    expect(arPaths).toEqual(enPaths);

    for (const path of arPaths) {
      const value = path
        .split(".")
        .reduce<unknown>((acc, key) => (acc as Record<string, unknown>)[key], adminAr);
      expect(typeof value).toBe("string");
      expect((value as string).trim().length).toBeGreaterThan(0);
    }
  });

  it("interpolates placeholders without corrupting literal text", () => {
    expect(
      interpolate(adminAr.products.form.colorsSelectedCount, { count: 3 })
    ).toContain("3");
    expect(
      interpolate(adminEn.products.form.previewSummary, {
        name: "Cedar",
        colors: 2,
        sizes: 1,
        addons: 0,
        stock: 15,
        price: 250
      })
    ).toBe(
      "Cedar will publish with 2 color option(s), 1 size option(s), 0 add-on(s), stock 15, and base price 250 EGP."
    );
  });

  it("translates governorate names for Arabic while preserving unknown values", () => {
    for (const gov of GOVERNORATES) {
      expect(governorateLabel(gov, "en")).toBe(gov);
      expect(governorateLabel(gov, "ar")).not.toBe("");
      expect(governorateLabel(gov, "ar")).not.toBe(gov);
    }
    expect(governorateLabel("Cairo", "ar")).toBe("القاهرة");
    expect(governorateLabel("Alexandria", "ar")).toBe("الإسكندرية");
    expect(governorateLabel("CustomRegion", "ar")).toBe("CustomRegion");
  });

  it("formats money in Arabic and English locales", () => {
    expect(formatMoney("380", "EGP", "en")).toContain("380");
    const arMoney = formatMoney("380", "EGP", "ar");
    expect(arMoney).toContain("380");
    expect(arMoney).toContain("ج.م");
  });

  it("localizes admin roles and order statuses", () => {
    expect(getAdminRoleLabel("Super Admin", "ar")).toBe("مدير عام");
    expect(getAdminRoleLabel("Super Admin", "en")).toBe("Super Admin");
    expect(statusLabels.ar.PENDING).toBe("بانتظار التأكيد");
    expect(statusLabels.en.PENDING).toBe("Pending");
  });
});
