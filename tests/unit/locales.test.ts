import { describe, expect, it } from "vitest";
import {
  localeOrEnglish,
  translate,
  weekdayNames,
} from "../../src/i18n/locales";

describe("tenant locale helpers", () => {
  it("falls back safely and translates supported customer copy", () => {
    expect(localeOrEnglish("pt")).toBe("pt");
    expect(localeOrEnglish("fr")).toBe("en");
    expect(translate("pt", "Book a visit")).toBe("Marcar uma visita");
    expect(translate("en", "Book a visit")).toBe("Book a visit");
    expect(translate("pt", "Tenant-owned content")).toBe(
      "Tenant-owned content",
    );
  });

  it("uses database weekday indexes for the Portuguese locale", () => {
    expect(weekdayNames.pt[0]).toBe("Domingo");
    expect(weekdayNames.pt[1]).toBe("Segunda-feira");
    expect(weekdayNames.pt[6]).toBe("Sábado");
  });
});
