import { z } from "zod";
export const customerSummarySchema = z.object({
  history_revision: z.string(),
  id: z.uuid(),
  tenant_id: z.uuid(),
  display_name: z.string(),
  email: z.string(),
  email_verified: z.boolean(),
  marketing_consent: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  version: z.number(),
  appointment_count: z.number(),
  completed_visits: z.number(),
  cancellations: z.number(),
  no_shows: z.number(),
  upcoming_visits: z.number(),
  awaiting_outcome: z.number(),
  completed_value_minor: z.number(),
  average_visit_minor: z.number(),
  last_visit_at: z.string().nullable(),
  next_visit_at: z.string().nullable(),
});
export type CustomerSummary = z.infer<typeof customerSummarySchema>;
export const customerEditSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().max(254),
  version: z.coerce.number().int().positive(),
});
export const historyFilters = [
  "all",
  "upcoming",
  "completed",
  "cancelled",
  "no_show",
] as const;
export type HistoryFilter = (typeof historyFilters)[number];
export type QueryValues = Record<string, string | string[] | undefined>;
export function scalar(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}
export function pageNumber(value: string | string[] | undefined) {
  const text = scalar(value);
  return /^\d{1,5}$/.test(text)
    ? Math.max(1, Math.min(Number(text), 10000))
    : 1;
}
export function literalSearch(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}
export function historyFilter(
  value: string | string[] | undefined,
): HistoryFilter {
  return historyFilters.find((f) => f === value) ?? "all";
}
