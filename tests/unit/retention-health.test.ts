import { describe, expect, it } from "vitest";
import {
  healthReason,
  type RetentionHealth,
} from "../../src/modules/customers/health";
import { rebookingMessage } from "../../src/modules/customers/outreach-model";

const health = (values: Partial<RetentionHealth> = {}): RetentionHealth => ({
  id: "00000000-0000-4000-8000-000000000001",
  tenant_id: "00000000-0000-4000-8000-000000000002",
  segment: "regular",
  days_since_visit: 32,
  duplicate_records: 0,
  completed_visit_days: 4,
  typical_interval_days: 28,
  due_in_days: -4,
  health_status: "overdue",
  ...values,
});

describe("retention health explanations", () => {
  it("explains an individual cadence without presenting a score", () => {
    expect(healthReason(health())).toBe(
      "Based on 4 completed visit days, this customer usually returns every 28 days. Their usual return point passed 4 days ago.",
    );
    expect(
      healthReason(health({ health_status: "due_soon", due_in_days: 1 })),
    ).toContain("usual return point is in 1 day");
  });

  it("explains when history is insufficient or needs review", () => {
    expect(
      healthReason(
        health({
          health_status: "building_history",
          typical_interval_days: null,
          due_in_days: null,
        }),
      ),
    ).toContain("More completed visit days");
    expect(healthReason(health({ health_status: "needs_review" }))).toContain(
      "Resolve the profile warning",
    );
  });
});

describe("rebooking outreach copy", () => {
  it("uses the customer first name, service and business", () => {
    expect(
      rebookingMessage("Paulo Silva", "Signature cut", "Porto Gentlemen"),
    ).toBe(
      "Hi Paulo, it looks like you may be due for your next Signature cut. Reply if you’d like us to help find a time. — Porto Gentlemen",
    );
  });
});
