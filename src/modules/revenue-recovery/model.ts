import { z } from "zod";

export const recoveryOpportunitySchema = z.object({
  tenant_id: z.uuid(),
  waitlist_entry_id: z.uuid(),
  customer_id: z.uuid(),
  customer_name: z.string(),
  customer_email: z.email(),
  service_id: z.uuid(),
  service_name: z.string(),
  price_minor: z.number().int().nonnegative(),
  preferred_staff_id: z.uuid().nullable(),
  staff_id: z.uuid(),
  staff_name: z.string(),
  source_appointment_id: z.uuid(),
  starts_at: z.string(),
  ends_at: z.string(),
  blocked_until: z.string(),
  earliest_date: z.string(),
  latest_date: z.string(),
  cancelled_at: z.string(),
  recovery_action_id: z.uuid().nullable(),
  contacted_at: z.string().nullable(),
  attributed_appointment_id: z.uuid().nullable(),
  match_reason: z.string(),
});

export const recoverySummarySchema = z.object({
  open_slots: z.number().int().nonnegative(),
  matching_customers: z.number().int().nonnegative(),
  contacts_recorded: z.number().int().nonnegative(),
  bookings_attributed: z.number().int().nonnegative(),
  booked_service_value_minor: z.number().int().nonnegative(),
  completed_recovered_value_minor: z.number().int().nonnegative(),
});
