import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const tenant = "11111111-1111-4111-8111-111111111111";
const location = "11111111-1111-4111-8111-111111111112";
const service = "10000000-0000-4000-8000-000000000001";
const staff = "30000000-0000-4000-8000-000000000001";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const client = (key = publishable) =>
  createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

let admin: SupabaseClient;
let owner: SupabaseClient;
let staffUser: SupabaseClient;
let other: SupabaseClient;
let customer = "";
let originalPolicy: Record<string, unknown>;
const appointments: string[] = [];

async function insertAppointment(
  startsAt: string,
  status: "confirmed" | "no_show" = "confirmed",
) {
  const start = new Date(startsAt);
  const inserted = await admin
    .from("appointments")
    .insert({
      tenant_id: tenant,
      location_id: location,
      customer_id: customer,
      service_id: service,
      staff_id: staff,
      service_name: "Synthetic protection service",
      price_minor: 4000,
      starts_at: start.toISOString(),
      ends_at: new Date(start.getTime() + 30 * 60_000).toISOString(),
      blocked_until: new Date(start.getTime() + 35 * 60_000).toISOString(),
      status,
    })
    .select("id")
    .single();
  expect(inserted.error).toBeNull();
  appointments.push(inserted.data!.id);
  return inserted.data!.id;
}

beforeAll(async () => {
  if (!["127.0.0.1", "localhost"].includes(new URL(url).hostname))
    throw new Error("Local tests only");
  admin = client(process.env.SUPABASE_SERVICE_ROLE_KEY!);
  owner = client();
  staffUser = client();
  other = client();
  for (const [db, email, password] of [
    [owner, "owner@porto-gentlemen.example", "PortoDemo!2026"],
    [staffUser, "staff@porto-gentlemen.example", "StaffDemo!2026"],
    [other, "owner@atelier-lisboa.example", "LisboaDemo!2026"],
  ] as const)
    expect(
      (await db.auth.signInWithPassword({ email, password })).error,
    ).toBeNull();

  const policy = await admin
    .from("revenue_protection_policies")
    .select("*")
    .eq("tenant_id", tenant)
    .single();
  expect(policy.error).toBeNull();
  originalPolicy = policy.data!;
  const created = await admin
    .from("customers")
    .insert({
      tenant_id: tenant,
      display_name: "Synthetic protection customer",
      email: `protection-${Date.now()}@test.example`,
    })
    .select("id")
    .single();
  expect(created.error).toBeNull();
  customer = created.data!.id;
});

afterAll(async () => {
  if (appointments.length)
    await admin.from("appointments").delete().in("id", appointments);
  if (customer) await admin.from("customers").delete().eq("id", customer);
  if (originalPolicy)
    await admin
      .from("revenue_protection_policies")
      .update({
        enabled: originalPolicy.enabled,
        deposit_rule: originalPolicy.deposit_rule,
        deposit_percent: originalPolicy.deposit_percent,
        cancellation_window_hours: originalPolicy.cancellation_window_hours,
        reminder_lead_hours: originalPolicy.reminder_lead_hours,
        version: originalPolicy.version,
      })
      .eq("tenant_id", tenant);
});

describe("revenue protection", () => {
  it("exposes public policy terms to members but restricts payment evidence and changes", async () => {
    expect(
      (
        await staffUser
          .from("revenue_protection_policies")
          .select("*")
          .eq("tenant_id", tenant)
      ).data,
    ).toHaveLength(1);
    expect(
      (
        await other
          .from("appointment_deposit_payments")
          .select("*")
          .eq("tenant_id", tenant)
      ).data,
    ).toEqual([]);
    expect(
      (
        await other.rpc("save_revenue_protection_policy", {
          p_tenant: tenant,
          p_enabled: true,
          p_deposit_rule: "all",
          p_deposit_percent: 50,
          p_cancellation_window_hours: 24,
          p_reminder_lead_hours: 24,
        })
      ).error?.code,
    ).toBe("42501");
  });

  it("snapshots explainable risk and applies a history-based deposit", async () => {
    const saved = await owner.rpc("save_revenue_protection_policy", {
      p_tenant: tenant,
      p_enabled: true,
      p_deposit_rule: "risk_based",
      p_deposit_percent: 40,
      p_cancellation_window_hours: 24,
      p_reminder_lead_hours: 48,
    });
    expect(saved.error).toBeNull();
    await insertAppointment("2019-01-10T10:00:00Z", "no_show");
    await insertAppointment("2020-01-10T10:00:00Z", "no_show");
    const protectedAppointment = await insertAppointment(
      "2035-01-10T10:00:00Z",
    );
    const snapshot = await owner
      .from("appointment_protections")
      .select("*")
      .eq("appointment_id", protectedAppointment)
      .single();
    expect(snapshot.error).toBeNull();
    expect(snapshot.data).toMatchObject({
      risk_level: "high",
      no_show_count: 2,
      deposit_required_minor: 1600,
      deposit_percent: 40,
      cancellation_window_hours: 24,
      reminder_lead_hours: 48,
    });
  });

  it("records payment, refund, reminder and conservative protected value", async () => {
    const refundable = appointments.at(-1)!;
    const paid = await owner.rpc("record_manual_deposit", {
      p_tenant: tenant,
      p_appointment: refundable,
    });
    expect(paid.error).toBeNull();
    const cancelled = await owner.rpc("owner_booking_change", {
      p_tenant: tenant,
      p_id: refundable,
      p_version: 1,
      p_action: "cancel",
    });
    expect(cancelled.error).toBeNull();
    const refundDue = await owner
      .from("revenue_protection_appointments")
      .select("deposit_state")
      .eq("appointment_id", refundable)
      .single();
    expect(refundDue.data!.deposit_state).toBe("refund_due");
    expect(
      (
        await owner.rpc("record_deposit_refund", {
          p_tenant: tenant,
          p_payment: paid.data!,
        })
      ).error,
    ).toBeNull();

    const reminderAppointment = await insertAppointment("2034-01-10T10:00:00Z");
    expect(
      (
        await owner.rpc("record_appointment_reminder", {
          p_tenant: tenant,
          p_appointment: reminderAppointment,
          p_confirmed: true,
        })
      ).error,
    ).toBeNull();
    expect(
      (
        await owner
          .from("revenue_protection_appointments")
          .select("reminder_state")
          .eq("appointment_id", reminderAppointment)
          .single()
      ).data!.reminder_state,
    ).toBe("sent");

    const retained = await insertAppointment("2021-01-10T10:00:00Z");
    expect(
      (
        await owner.rpc("record_manual_deposit", {
          p_tenant: tenant,
          p_appointment: retained,
        })
      ).error,
    ).toBeNull();
    expect(
      (
        await owner.rpc("owner_booking_change", {
          p_tenant: tenant,
          p_id: retained,
          p_version: 1,
          p_action: "no_show",
        })
      ).error,
    ).toBeNull();
    const summary = await owner.rpc("revenue_protection_summary", {
      p_tenant: tenant,
    });
    expect(summary.error).toBeNull();
    expect(summary.data.protected_value_minor).toBeGreaterThanOrEqual(1600);
    expect(summary.data.refunds_due_minor).toBe(0);
  });
});
