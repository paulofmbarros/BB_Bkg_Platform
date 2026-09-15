import { describe, expect, it } from "vitest";
import {
  opportunityReason,
  opportunityTiming,
  type RebookingOpportunity,
} from "../../src/modules/customers/opportunity-model";

const opportunity = (due_in_days: number): RebookingOpportunity => ({
  id: "00000000-0000-4000-8000-000000000001",
  tenant_id: "00000000-0000-4000-8000-000000000002",
  display_name: "Paulo Silva",
  email: "paulo@example.com",
  marketing_consent: false,
  last_visit_at: "2026-08-11T09:00:00Z",
  completed_visit_days: 4,
  typical_interval_days: 28,
  days_since_visit: 34,
  due_in_days,
  service_id: "00000000-0000-4000-8000-000000000003",
  staff_id: "00000000-0000-4000-8000-000000000004",
  service_name: "Signature cut",
  potential_value_minor: 2800,
  staff_name: "João Costa",
});

describe("rebooking opportunity explanations", () => {
  it("explains the cadence without presenting it as a prediction", () => {
    expect(opportunityReason(opportunity(-6))).toBe(
      "Usually returns every 28 days. Last completed visit was 34 days ago.",
    );
  });

  it("labels future, current and overdue timing", () => {
    expect(opportunityTiming(opportunity(3))).toBe("Due in 3 days");
    expect(opportunityTiming(opportunity(1))).toBe("Due in 1 day");
    expect(opportunityTiming(opportunity(0))).toBe("Due today");
    expect(opportunityTiming(opportunity(-1))).toBe("1 day overdue");
    expect(opportunityTiming(opportunity(-6))).toBe("6 days overdue");
  });
});
