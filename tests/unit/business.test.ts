import { describe, it, expect } from "vitest";
import {
  serviceSchema,
  hoursSchema,
  priceToMinorUnits,
  exceptionSchema,
} from "../../src/modules/businesses/validation";
import { weeklyHours, defaultHours } from "../../src/modules/scheduling/hours";
import { normalizeHost, isWorkspaceHost } from "../../src/modules/tenancy/host";
import { contrastRatio, contrastText, shopTheme } from "../../src/lib/format";
describe("Business validation", () => {
  it("converts prices exactly, without binary rounding", () => {
    expect(priceToMinorUnits("19.99")).toBe(1999);
    expect(priceToMinorUnits("0.29")).toBe(29);
    expect(priceToMinorUnits("28.5")).toBe(2850);
  });
  it("rejects negative prices, fractions of a cent, and unsafe durations", () => {
    const input = {
      name: "Cut",
      description: "",
      category: "Hair",
      duration_minutes: 45,
      buffer_minutes: 5,
      price: "28.00",
      active: true,
    };
    for (const bad of [
      { price: "-1" },
      { price: "10.001" },
      { price: "1e4" },
      { duration_minutes: 0 },
      { buffer_minutes: -1 },
    ])
      expect(serviceSchema.safeParse({ ...input, ...bad }).success).toBe(false);
  });
  it("subtracts breaks and closed days from capacity", () => {
    expect(weeklyHours(defaultHours())).toBe(45);
  });
  it("rejects inverted shifts, incomplete breaks, breaks outside shifts and duplicate weekdays", () => {
    for (const patch of [
      { end_time: "08:00" },
      { break_end: null },
      { break_start: "08:00" },
    ]) {
      const rows = defaultHours();
      rows[0] = { ...rows[0], ...patch };
      expect(hoursSchema.safeParse(rows).success).toBe(false);
    }
    const duplicate = defaultHours();
    duplicate[1].weekday = duplicate[0].weekday;
    expect(hoursSchema.safeParse(duplicate).success).toBe(false);
    expect(hoursSchema.safeParse(defaultHours()).success).toBe(true);
  });
  it("validates actual exception dates and their order", () => {
    expect(
      exceptionSchema.safeParse({
        start_date: "2026-02-30",
        end_date: "2026-03-01",
        reason: "Leave",
      }).success,
    ).toBe(false);
    expect(
      exceptionSchema.safeParse({
        start_date: "2026-09-20",
        end_date: "2026-09-19",
        reason: "Leave",
      }).success,
    ).toBe(false);
  });
  it("normalizes domain names and rejects spoofed host syntax", () => {
    expect(normalizeHost("PORTO.localhost:3000")).toBe("porto.localhost");
    for (const raw of [
      "shop.localhost@evil.com",
      "shop.localhost/evil",
      "shop.localhost,evil.com",
      "shop.localhost?x",
    ])
      expect(normalizeHost(raw)).toBeNull();
    expect(isWorkspaceHost("evil.localhost", "http://127.0.0.1:3000")).toBe(
      false,
    );
  });
  it("chooses legible text for tenant colours", () => {
    expect(contrastText("#ffffff")).toBe("#151b18");
    expect(contrastText("#000000")).toBe("#ffffff");
  });
  it("derives branded surfaces and accessible text from the tenant colour", () => {
    for (const accent of ["#c62828", "#f4c430", "#ffffff", "#111111"]) {
      const theme = shopTheme(accent);
      expect(theme["--shop-accent"]).toBe(accent);
      expect(theme["--shop-surface"]).not.toBe("#edeedf");
      expect(
        contrastRatio(theme["--shop-on-accent"], theme["--shop-accent"]),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(
          theme["--shop-accent-text"],
          theme["--shop-surface-strong"],
        ),
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});
