import { describe, expect, it } from "vitest";
import {
  summarizeBusinessDay,
  type BriefAppointment,
} from "../../src/modules/businesses/brief-model";

const appointment = (
  id: string,
  starts_at: string,
  status: string,
  price_minor = 2800,
): BriefAppointment => ({
  id,
  customer_id: id,
  starts_at,
  ends_at: new Date(new Date(starts_at).getTime() + 30 * 60_000).toISOString(),
  service_name: "Signature cut",
  price_minor,
  status,
  customers: { display_name: `Customer ${id}` },
  staff_members: { display_name: "Rafael Costa" },
});

describe("daily business brief", () => {
  it("uses Lisbon dates, orders remaining visits, and totals only completed service value", () => {
    const now = new Date("2026-07-10T10:00:00Z");
    const result = summarizeBusinessDay(
      [
        appointment("later", "2026-07-10T15:00:00Z", "confirmed"),
        appointment("next", "2026-07-10T11:00:00Z", "confirmed"),
        appointment("past-confirmed", "2026-07-10T08:00:00Z", "confirmed"),
        appointment("completed", "2026-07-10T07:00:00Z", "completed", 3250),
        appointment("cancelled", "2026-07-10T09:00:00Z", "cancelled", 5000),
        appointment("previous-day", "2026-07-09T22:30:00Z", "completed", 9000),
      ],
      4,
      now,
    );

    expect(result.day).toBe("2026-07-10");
    expect(result.upcoming.map(({ id }) => id)).toEqual(["next", "later"]);
    expect(result.outstandingOutcomes).toBe(4);
    expect(result.completedVisits).toBe(1);
    expect(result.completedValueMinor).toBe(3250);
  });

  it("handles Lisbon's repeated autumn hour without moving visits to another day", () => {
    const now = new Date("2026-10-25T00:45:00Z");
    const result = summarizeBusinessDay(
      [
        appointment("first-hour", "2026-10-25T00:30:00Z", "completed", 2000),
        appointment("second-hour", "2026-10-25T01:30:00Z", "completed", 3000),
      ],
      0,
      now,
    );

    expect(result.day).toBe("2026-10-25");
    expect(result.completedVisits).toBe(2);
    expect(result.completedValueMinor).toBe(5000);
  });
});
