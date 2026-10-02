import { describe, expect, it } from "vitest";
import {
  assessAttendanceRisk,
  riskExplanation,
} from "../../src/modules/revenue-protection/model";

describe("deterministic attendance risk", () => {
  it("uses visible attendance history instead of an opaque score", () => {
    expect(
      assessAttendanceRisk({ completed: 5, noShows: 0, cancellations: 1 }),
    ).toBe("standard");
    expect(
      assessAttendanceRisk({ completed: 4, noShows: 1, cancellations: 0 }),
    ).toBe("elevated");
    expect(
      assessAttendanceRisk({ completed: 0, noShows: 1, cancellations: 0 }),
    ).toBe("high");
    expect(
      assessAttendanceRisk({ completed: 8, noShows: 2, cancellations: 0 }),
    ).toBe("high");
  });

  it("explains the same evidence in the workspace locale", () => {
    const history = {
      completed_count: 3,
      no_show_count: 1,
      cancelled_count: 0,
    };
    expect(riskExplanation(history)).toBe(
      "1 prior no-show, 3 completed visits.",
    );
    expect(riskExplanation(history, "pt")).toBe(
      "1 falta, 3 visitas concluídas.",
    );
  });
});
