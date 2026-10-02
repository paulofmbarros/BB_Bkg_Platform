import { z } from "zod";

export const healthStatuses = [
  "needs_review",
  "booked",
  "overdue",
  "due_soon",
  "on_track",
  "inactive",
  "at_risk",
  "building_history",
] as const;

export const retentionHealthSchema = z.object({
  id: z.uuid(),
  tenant_id: z.uuid(),
  segment: z.string(),
  days_since_visit: z.number().nullable(),
  duplicate_records: z.number(),
  completed_visit_days: z.number(),
  typical_interval_days: z.number().nullable(),
  due_in_days: z.number().nullable(),
  health_status: z.enum(healthStatuses),
});

export type RetentionHealth = z.infer<typeof retentionHealthSchema>;

export const healthLabels: Record<RetentionHealth["health_status"], string> = {
  needs_review: "Needs review",
  booked: "Next visit booked",
  overdue: "Past usual return time",
  due_soon: "Due soon",
  on_track: "On track",
  inactive: "Inactive",
  at_risk: "At risk",
  building_history: "Building history",
};

export function healthReason(health: RetentionHealth) {
  if (health.health_status === "needs_review")
    return "Resolve the profile warning before relying on its retention history.";
  if (health.health_status === "booked")
    return "A future appointment is already confirmed, so no retention action is suggested.";
  if (health.typical_interval_days !== null && health.due_in_days !== null) {
    const cadence = `Based on ${health.completed_visit_days} completed visit days, this customer usually returns every ${health.typical_interval_days} days.`;
    if (health.health_status === "overdue")
      return `${cadence} Their usual return point passed ${Math.abs(health.due_in_days)} ${health.due_in_days === -1 ? "day" : "days"} ago.`;
    if (health.health_status === "due_soon")
      return health.due_in_days === 0
        ? `${cadence} Their usual return point is today.`
        : `${cadence} Their usual return point is in ${health.due_in_days} ${health.due_in_days === 1 ? "day" : "days"}.`;
    return `${cadence} Their usual return point is in ${health.due_in_days} days.`;
  }
  if (health.health_status === "inactive")
    return `${health.days_since_visit} days have passed since the last completed visit. There is not enough consistent visit history for an individual return cadence.`;
  if (health.health_status === "at_risk")
    return `${health.days_since_visit} days have passed since the last completed visit. There is not enough consistent visit history for an individual return cadence.`;
  return "More completed visit days are needed before Noma can explain this customer’s usual return timing.";
}
