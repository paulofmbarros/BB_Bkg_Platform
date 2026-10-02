import { z } from "zod";
import type { Locale } from "@/i18n/locales";

export const depositRuleSchema = z.enum(["none", "risk_based", "all"]);
export const riskLevelSchema = z.enum(["standard", "elevated", "high"]);
export const depositStateSchema = z.enum([
  "not_required",
  "pending",
  "paid",
  "refund_due",
  "refunded",
  "retained",
]);
export const reminderStateSchema = z.enum([
  "not_required",
  "upcoming",
  "due",
  "sent",
]);

export const protectionPolicySchema = z.object({
  tenant_id: z.uuid(),
  enabled: z.boolean(),
  deposit_rule: depositRuleSchema,
  deposit_percent: z.number().int().min(10).max(100),
  cancellation_window_hours: z.number().int().min(0).max(168),
  reminder_lead_hours: z.number().int().min(1).max(168),
  version: z.number().int().positive(),
});

export const protectionAppointmentSchema = z.object({
  tenant_id: z.uuid(),
  appointment_id: z.uuid(),
  customer_id: z.uuid(),
  customer_name: z.string(),
  customer_email: z.string(),
  service_name: z.string(),
  price_minor: z.number().int().nonnegative(),
  starts_at: z.string(),
  appointment_status: z.enum([
    "confirmed",
    "cancelled",
    "completed",
    "no_show",
  ]),
  cancelled_at: z.string().nullable(),
  risk_level: riskLevelSchema,
  completed_count: z.number().int().nonnegative(),
  no_show_count: z.number().int().nonnegative(),
  cancelled_count: z.number().int().nonnegative(),
  deposit_required_minor: z.number().int().nonnegative(),
  deposit_percent: z.number().int().nonnegative(),
  cancellation_window_hours: z.number().int().nonnegative(),
  reminder_lead_hours: z.number().int().positive(),
  cancellation_deadline: z.string(),
  reminder_due_at: z.string(),
  deposit_paid_minor: z.number().int().nonnegative(),
  deposit_refunded_minor: z.number().int().nonnegative(),
  deposit_state: depositStateSchema,
  reminder_state: reminderStateSchema,
  protected_value_minor: z.number().int().nonnegative(),
});

export const protectionSummarySchema = z.object({
  at_risk_upcoming: z.number().int().nonnegative(),
  deposits_required: z.number().int().nonnegative(),
  deposit_secured_minor: z.number().int().nonnegative(),
  refunds_due_minor: z.number().int().nonnegative(),
  reminders_due: z.number().int().nonnegative(),
  protected_value_minor: z.number().int().nonnegative(),
});

export const depositPaymentSchema = z.object({
  id: z.uuid(),
  appointment_id: z.uuid(),
  provider: z.enum(["stripe", "manual"]),
  provider_reference: z.string(),
  provider_payment_intent: z.string().nullable(),
  status: z.enum(["pending", "paid", "failed", "refunded"]),
  amount_minor: z.number().int().positive(),
  refunded_minor: z.number().int().nonnegative(),
});

export type ProtectionPolicy = z.infer<typeof protectionPolicySchema>;
export type ProtectionAppointment = z.infer<typeof protectionAppointmentSchema>;
export type ProtectionSummary = z.infer<typeof protectionSummarySchema>;
export type DepositPayment = z.infer<typeof depositPaymentSchema>;
export type RiskLevel = z.infer<typeof riskLevelSchema>;

export function assessAttendanceRisk(history: {
  completed: number;
  noShows: number;
  cancellations: number;
}): RiskLevel {
  if (history.noShows >= 2 || (history.noShows >= 1 && history.completed === 0))
    return "high";
  if (
    history.noShows === 1 ||
    (history.cancellations >= 2 && history.completed < 2)
  )
    return "elevated";
  return "standard";
}

export function riskExplanation(
  appointment: Pick<
    ProtectionAppointment,
    "completed_count" | "no_show_count" | "cancelled_count"
  >,
  locale: Locale = "en",
) {
  const { completed_count, no_show_count, cancelled_count } = appointment;
  if (locale === "pt") {
    if (no_show_count > 0)
      return `${no_show_count} ${no_show_count === 1 ? "falta" : "faltas"}, ${completed_count} ${completed_count === 1 ? "visita concluída" : "visitas concluídas"}.`;
    if (cancelled_count > 0)
      return `${cancelled_count} ${cancelled_count === 1 ? "cancelamento" : "cancelamentos"}, ${completed_count} ${completed_count === 1 ? "visita concluída" : "visitas concluídas"}.`;
    return completed_count > 0
      ? `${completed_count} ${completed_count === 1 ? "visita concluída" : "visitas concluídas"}, sem faltas.`
      : "Sem histórico anterior de comparência.";
  }
  if (no_show_count > 0)
    return `${no_show_count} prior ${no_show_count === 1 ? "no-show" : "no-shows"}, ${completed_count} completed ${completed_count === 1 ? "visit" : "visits"}.`;
  if (cancelled_count > 0)
    return `${cancelled_count} prior ${cancelled_count === 1 ? "cancellation" : "cancellations"}, ${completed_count} completed ${completed_count === 1 ? "visit" : "visits"}.`;
  return completed_count > 0
    ? `${completed_count} completed ${completed_count === 1 ? "visit" : "visits"}, no no-shows.`
    : "No prior attendance history.";
}

export function depositRuleLabel(
  rule: z.infer<typeof depositRuleSchema>,
  locale: Locale = "en",
) {
  if (locale === "pt")
    return rule === "none"
      ? "Sem depósitos"
      : rule === "risk_based"
        ? "Apenas risco elevado"
        : "Todas as marcações";
  return rule === "none"
    ? "No deposits"
    : rule === "risk_based"
      ? "Elevated risk only"
      : "Every appointment";
}
