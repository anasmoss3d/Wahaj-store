import { describe, expect, it } from "vitest";
import { sanitizeNextPath, sanitizeNextQueryParam } from "@/lib/security";

describe("sanitizeNextPath", () => {
  it("allows safe admin subpaths only for admins", () => {
    expect(sanitizeNextPath("/admin", { role: "admin" })).toBe("/admin");
    expect(sanitizeNextPath("/admin/orders/123?tab=items", { role: "admin" })).toBe(
      "/admin/orders/123?tab=items"
    );
    expect(sanitizeNextPath("/admin/login", { role: "admin" })).toBe("/admin");
    expect(sanitizeNextPath("/account", { role: "admin" })).toBe("/admin");
  });

  it("blocks admin and auth paths for customers", () => {
    expect(sanitizeNextPath("/admin", { role: "customer" })).toBe("/account");
    expect(sanitizeNextPath("/admin/orders", { role: "customer" })).toBe("/account");
    expect(sanitizeNextPath("/api/admin/products", { role: "customer" })).toBe("/account");
    expect(sanitizeNextPath("/auth/login", { role: "customer" })).toBe("/account");
    expect(sanitizeNextPath("/products?category=candles", { role: "customer" })).toBe(
      "/products?category=candles"
    );
  });

  it("rejects open-redirect bypass attempts", () => {
    const payloads = [
      "https://evil.com",
      "//evil.com",
      "/\\evil.com",
      "///evil.com",
      "/@evil.com",
      "https://wahaj.internal@evil.com/admin",
      "/admin\nLocation: https://evil.com",
      "javascript:alert(1)"
    ];

    for (const payload of payloads) {
      expect(sanitizeNextPath(payload, { role: "admin" })).toBe("/admin");
      expect(sanitizeNextPath(payload, { role: "customer" })).toBe("/account");
      expect(sanitizeNextQueryParam(payload)).toBeNull();
    }
  });

  it("preserves safe query param paths without auth/admin-login loops", () => {
    expect(sanitizeNextQueryParam("/admin/orders")).toBe("/admin/orders");
    expect(sanitizeNextQueryParam("/checkout")).toBe("/checkout");
    expect(sanitizeNextQueryParam("/admin/login")).toBeNull();
    expect(sanitizeNextQueryParam("/auth/register")).toBeNull();
  });
});
