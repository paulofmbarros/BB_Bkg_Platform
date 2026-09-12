import { z } from "zod";
export const slotSchema = z.object({
  starts_at: z.string(),
  ends_at: z.string(),
});
export type Slot = z.infer<typeof slotSchema>;
export const receiptSchema = z.object({
  id: z.string(),
  service_id: z.string(),
  staff_id: z.string(),
  service_name: z.string(),
  barber: z.string(),
  customer_name: z.string(),
  price_minor: z.number(),
  starts_at: z.string(),
  ends_at: z.string(),
  status: z.enum(["confirmed", "cancelled", "completed", "no_show"]),
  version: z.number(),
});
export type Receipt = z.infer<typeof receiptSchema>;
export function shopDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function addDays(day: string, count: number) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + count);
  return d.toISOString().slice(0, 10);
}
export function slotLabel(instant: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Lisbon",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "shortOffset",
  }).format(new Date(instant));
}
export function appointmentDate(instant: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Lisbon",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(instant));
}
