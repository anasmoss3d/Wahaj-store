import { describe, expect, it } from "vitest";
import {
  cairoDayEnd,
  cairoDayKey,
  cairoDayStart,
  cairoOrderDatePrefix,
  formatDateTime
} from "@/lib/datetime";

describe("cairo time", () => {
  it("keys midnight UTC winter instants to the Cairo day", () => {
    // 2026-01-01T00:00Z is 02:00 in Cairo (UTC+2, no DST)
    expect(cairoDayKey(new Date("2026-01-01T00:00:00Z"))).toBe("2026-01-01");
    // 2025-12-31T22:30Z is 2026-01-01 00:30 in Cairo
    expect(cairoDayKey(new Date("2025-12-31T22:30:00Z"))).toBe("2026-01-01");
  });

  it("observes Cairo daylight saving in summer", () => {
    // 2026-07-01T00:00Z is 03:00 in Cairo (UTC+3 DST)
    expect(cairoDayKey(new Date("2026-07-01T00:00:00Z"))).toBe("2026-07-01");
    expect(formatDateTime(new Date("2026-07-01T00:00:00Z"), "en")).toContain("3:00 AM");
  });

  it("starts Cairo days at the right UTC instant", () => {
    // Cairo midnight 2026-01-01 = 2025-12-31T22:00Z (UTC+2)
    expect(cairoDayStart("2026-01-01").toISOString()).toBe("2025-12-31T22:00:00.000Z");
    expect(cairoDayEnd("2026-01-01").toISOString()).toBe("2026-01-01T21:59:59.999Z");
  });

  it("formats in Cairo time regardless of server zone", () => {
    expect(formatDateTime(new Date("2026-01-01T00:00:00Z"), "en")).toContain("2:00 AM");
    expect(cairoOrderDatePrefix()).toMatch(/^WAH-\d{8}$/);
  });
});
