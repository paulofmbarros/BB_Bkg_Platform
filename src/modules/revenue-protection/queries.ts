import "server-only";
import { requireMemberManager } from "@/modules/tenancy/context";
import {
  depositPaymentSchema,
  protectionAppointmentSchema,
  protectionPolicySchema,
  protectionSummarySchema,
} from "./model";

export async function getRevenueProtection(slug: string) {
  const context = await requireMemberManager(slug);
  const { db, tenant } = context;
  const [policy, summary, appointments, payments] = await Promise.all([
    db
      .from("revenue_protection_policies")
      .select("*")
      .eq("tenant_id", tenant.id)
      .single(),
    db.rpc("revenue_protection_summary", { p_tenant: tenant.id }),
    db
      .from("revenue_protection_appointments")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("starts_at", { ascending: true }),
    db
      .from("appointment_deposit_payments")
      .select(
        "id,appointment_id,provider,provider_reference,provider_payment_intent,status,amount_minor,refunded_minor",
      )
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false }),
  ]);
  if (policy.error || summary.error || appointments.error || payments.error)
    throw new Error("Could not load revenue protection.");
  const paymentsByAppointment = new Map(
    (payments.data ?? [])
      .map((row) => depositPaymentSchema.parse(row))
      .map((payment) => [payment.appointment_id, payment] as const),
  );
  return {
    ...context,
    policy: protectionPolicySchema.parse(policy.data),
    summary: protectionSummarySchema.parse(summary.data),
    appointments: (appointments.data ?? []).map((row) => {
      const appointment = protectionAppointmentSchema.parse(row);
      return {
        ...appointment,
        payment: paymentsByAppointment.get(appointment.appointment_id) ?? null,
      };
    }),
    stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
    now: new Date().toISOString(),
  };
}
