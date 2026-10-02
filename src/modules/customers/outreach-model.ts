import { z } from "zod";
import type { Locale } from "@/i18n/locales";

export const outreachActionSchema = z.object({
  id: z.uuid(),
  tenant_id: z.uuid(),
  customer_id: z.uuid(),
  consent_event_id: z.uuid(),
  channel: z.literal("email"),
  purpose: z.literal("rebooking"),
  message: z.string(),
  recorded_by: z.uuid(),
  contacted_at: z.string(),
  attributed_appointment_id: z.uuid().nullable(),
  attributed_at: z.string().nullable(),
});

export type OutreachAction = z.infer<typeof outreachActionSchema>;

export const outreachSummarySchema = z.object({
  outreach_count: z.number().int().nonnegative(),
  attributed_bookings: z.number().int().nonnegative(),
  attributed_service_value_minor: z.number().int().nonnegative(),
});

export function rebookingMessage(
  customerName: string,
  serviceName: string,
  businessName: string,
  locale: Locale = "en",
) {
  const firstName = customerName.trim().split(/\s+/)[0] || customerName;
  if (locale === "pt")
    return `Olá ${firstName}, parece que está na altura do seu próximo serviço de ${serviceName}. Responda se quiser ajuda para encontrar um horário. — ${businessName}`;
  return `Hi ${firstName}, it looks like you may be due for your next ${serviceName}. Reply if you’d like us to help find a time. — ${businessName}`;
}
