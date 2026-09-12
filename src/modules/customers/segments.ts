import { z } from "zod";
export const segments = [
  "new",
  "returning",
  "regular",
  "at_risk",
  "inactive",
  "needs_review",
] as const;
export type Segment = (typeof segments)[number];
export const segmentLabels: Record<Segment, string> = {
  new: "New",
  returning: "Returning",
  regular: "Regular",
  at_risk: "At risk",
  inactive: "Inactive",
  needs_review: "Needs review",
};
export const segmentFields = z.object({
  segment: z.enum(segments),
  days_since_visit: z.number().nullable(),
  duplicate_records: z.number(),
});
export type SegmentFields = z.infer<typeof segmentFields>;
export function segmentReason(
  c: SegmentFields & {
    completed_visits: number;
    upcoming_visits: number;
    awaiting_outcome: number;
  },
) {
  if (c.segment === "needs_review")
    return [
      c.duplicate_records > 0
        ? `${c.duplicate_records} other active ${c.duplicate_records === 1 ? "record uses" : "records use"} this email; confirm identity before relying on the combined history.`
        : "",
      c.awaiting_outcome > 0
        ? `${c.awaiting_outcome} past or ongoing ${c.awaiting_outcome === 1 ? "appointment needs" : "appointments need"} an outcome.`
        : "",
      c.days_since_visit !== null && c.days_since_visit < 0
        ? "A completed visit has a future date; check the record."
        : "",
    ]
      .filter(Boolean)
      .join(" ");
  if (c.segment === "at_risk" || c.segment === "inactive")
    return `${c.days_since_visit} days since the last completed visit, with no upcoming appointment. The ${segmentLabels[c.segment].toLowerCase()} threshold is ${c.segment === "at_risk" ? 60 : 120} days.`;
  return `${c.completed_visits} completed ${c.completed_visits === 1 ? "visit" : "visits"}${c.upcoming_visits > 0 ? ` and ${c.upcoming_visits} upcoming ${c.upcoming_visits === 1 ? "appointment" : "appointments"}` : ""}. ${c.segment === "new" ? "New covers zero or one completed visit." : c.segment === "returning" ? "Returning covers two completed visits." : "Regular covers three or more completed visits."}${c.upcoming_visits > 0 ? " A future booking keeps this profile out of at-risk and inactive segments." : ""}`;
}
