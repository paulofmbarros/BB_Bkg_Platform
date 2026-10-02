import { z } from "zod";
import type { Locale } from "@/i18n/locales";

export const rebookingOpportunitySchema = z.object({
  id: z.uuid(),
  tenant_id: z.uuid(),
  display_name: z.string(),
  email: z.string(),
  marketing_consent: z.boolean(),
  last_visit_at: z.string(),
  completed_visit_days: z.number().int().min(3),
  typical_interval_days: z.number().int().positive(),
  days_since_visit: z.number().int().nonnegative(),
  due_in_days: z.number().int(),
  service_id: z.uuid(),
  staff_id: z.uuid(),
  service_name: z.string(),
  potential_value_minor: z.number().int().nonnegative(),
  staff_name: z.string().nullable(),
});

export type RebookingOpportunity = z.infer<typeof rebookingOpportunitySchema>;

export const opportunitySummarySchema = z.object({
  count: z.number().int().nonnegative(),
  potential_value_minor: z.number().int().nonnegative(),
});

export function opportunityTiming(
  opportunity: RebookingOpportunity,
  locale: Locale = "en",
) {
  if (locale === "pt") {
    if (opportunity.due_in_days < 0)
      return `${Math.abs(opportunity.due_in_days)} ${opportunity.due_in_days === -1 ? "dia" : "dias"} após a data habitual`;
    if (opportunity.due_in_days === 0) return "Data habitual hoje";
    return `Data habitual dentro de ${opportunity.due_in_days} ${opportunity.due_in_days === 1 ? "dia" : "dias"}`;
  }
  if (opportunity.due_in_days < 0)
    return `${Math.abs(opportunity.due_in_days)} ${opportunity.due_in_days === -1 ? "day" : "days"} overdue`;
  if (opportunity.due_in_days === 0) return "Due today";
  return `Due in ${opportunity.due_in_days} ${opportunity.due_in_days === 1 ? "day" : "days"}`;
}

export function opportunityReason(
  opportunity: RebookingOpportunity,
  locale: Locale = "en",
) {
  if (locale === "pt")
    return `Regressa habitualmente a cada ${opportunity.typical_interval_days} dias. A última visita concluída foi há ${opportunity.days_since_visit} dias.`;
  return `Usually returns every ${opportunity.typical_interval_days} days. Last completed visit was ${opportunity.days_since_visit} days ago.`;
}
