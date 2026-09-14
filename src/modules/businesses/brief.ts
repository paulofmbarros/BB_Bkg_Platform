import "server-only";
import { addDays, shopDate } from "@/modules/bookings/types";
import type { Business } from "@/modules/businesses/queries";
import {
  summarizeBusinessDay,
  type BriefAppointment,
} from "@/modules/businesses/brief-model";

export async function getBusinessBrief(business: Business, now = new Date()) {
  const day = shopDate(now);
  const appointmentsQuery = business.supportMode
    ? business.db
        .from("appointments")
        .select(
          "id,customer_id,starts_at,ends_at,service_name,price_minor,status,staff_members(display_name)",
        )
    : business.db
        .from("appointments")
        .select(
          "id,customer_id,starts_at,ends_at,service_name,price_minor,status,customers(display_name),staff_members(display_name)",
        );
  const [appointments, outstanding] = await Promise.all([
    appointmentsQuery
      .eq("tenant_id", business.tenant.id)
      .gte("starts_at", `${addDays(day, -1)}T23:00:00Z`)
      .lt("starts_at", `${addDays(day, 1)}T00:00:00Z`)
      .order("starts_at"),
    business.db
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", business.tenant.id)
      .eq("status", "confirmed")
      .lte("starts_at", now.toISOString()),
  ]);
  if (appointments.error || outstanding.error)
    throw new Error("Could not load today's business brief.");

  return summarizeBusinessDay(
    (appointments.data ?? []) as BriefAppointment[],
    outstanding.count ?? 0,
    now,
  );
}
