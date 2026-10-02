"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/modules/businesses/actions";
import { requireMemberManager } from "@/modules/tenancy/context";
import { depositRuleSchema } from "./model";

const uuid = z.uuid();

function result(
  error: { code?: string; message: string } | null,
  message: string,
) {
  if (!error) return { ok: true, message };
  return {
    ok: false,
    message:
      error.code === "P0001" ? error.message : "The change could not be saved.",
  };
}

function refresh(slug: string) {
  revalidatePath(`/workspace/${slug}/revenue-protection`);
  revalidatePath(`/workspace/${slug}/calendar`);
}

export async function saveProtectionPolicy(
  slug: string,
  _previous: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  void _previous;
  const { db, tenant } = await requireMemberManager(slug);
  const parsed = z
    .object({
      enabled: z.boolean(),
      deposit_rule: depositRuleSchema,
      deposit_percent: z.coerce.number().int().min(10).max(100),
      cancellation_window_hours: z.coerce.number().int().min(0).max(168),
      reminder_lead_hours: z.coerce.number().int().min(1).max(168),
    })
    .safeParse({
      ...Object.fromEntries(form),
      enabled: form.get("enabled") === "on",
    });
  if (!parsed.success)
    return { ok: false, message: "Check the protection policy." };
  const value = parsed.data;
  const { error } = await db.rpc("save_revenue_protection_policy", {
    p_tenant: tenant.id,
    p_enabled: value.enabled,
    p_deposit_rule: value.deposit_rule,
    p_deposit_percent: value.deposit_percent,
    p_cancellation_window_hours: value.cancellation_window_hours,
    p_reminder_lead_hours: value.reminder_lead_hours,
  });
  refresh(slug);
  return result(error, "Revenue protection policy saved.");
}

export async function recordManualDeposit(
  slug: string,
  appointment: string,
  _previous: ActionResult,
  _form?: FormData,
): Promise<ActionResult> {
  void _previous;
  void _form;
  const { db, tenant } = await requireMemberManager(slug);
  const parsed = uuid.safeParse(appointment);
  if (!parsed.success) return { ok: false, message: "Invalid appointment." };
  const { error } = await db.rpc("record_manual_deposit", {
    p_tenant: tenant.id,
    p_appointment: parsed.data,
  });
  refresh(slug);
  return result(error, "Deposit recorded.");
}

export async function recordReminder(
  slug: string,
  appointment: string,
  _previous: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const { db, tenant } = await requireMemberManager(slug);
  const parsed = uuid.safeParse(appointment);
  if (!parsed.success) return { ok: false, message: "Invalid appointment." };
  const { error } = await db.rpc("record_appointment_reminder", {
    p_tenant: tenant.id,
    p_appointment: parsed.data,
    p_confirmed: form.get("confirmed") === "on",
  });
  refresh(slug);
  return result(error, "Reminder recorded.");
}

export async function refundDeposit(
  slug: string,
  paymentId: string,
  _previous: ActionResult,
  _form?: FormData,
): Promise<ActionResult> {
  void _previous;
  void _form;
  const { db, tenant } = await requireMemberManager(slug);
  const parsed = uuid.safeParse(paymentId);
  if (!parsed.success) return { ok: false, message: "Invalid payment." };
  const payment = await db
    .from("appointment_deposit_payments")
    .select("id,provider,provider_payment_intent,status")
    .eq("tenant_id", tenant.id)
    .eq("id", parsed.data)
    .single();
  if (payment.error || payment.data.status !== "paid")
    return { ok: false, message: "This deposit cannot be refunded." };

  let refundReference: string | null = null;
  if (payment.data.provider === "stripe") {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret || !payment.data.provider_payment_intent)
      return { ok: false, message: "Stripe refunds are not configured." };
    const response = await fetch("https://api.stripe.com/v1/refunds", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Idempotency-Key": `noma-refund-${payment.data.id}`,
      },
      body: new URLSearchParams({
        payment_intent: payment.data.provider_payment_intent,
      }),
    });
    const refund = (await response.json()) as {
      id?: string;
      error?: { message?: string };
    };
    if (!response.ok || !refund.id)
      return {
        ok: false,
        message:
          refund.error?.message ?? "Stripe could not refund this deposit.",
      };
    refundReference = refund.id;
  }
  const { error } = await db.rpc("record_deposit_refund", {
    p_tenant: tenant.id,
    p_payment: payment.data.id,
    p_provider_reference: refundReference ?? undefined,
  });
  refresh(slug);
  return result(error, "Deposit refunded.");
}
