import { afterAll, beforeAll, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { addDays, shopDate } from "../../src/modules/bookings/types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const tenant = "11111111-1111-4111-8111-111111111111";
const location = "11111111-1111-4111-8111-111111111112";
const service = "10000000-0000-4000-8000-000000000001";
const staffId = "30000000-0000-4000-8000-000000000001";
const customer = crypto.randomUUID();
const appointments: string[] = [];
const client = (publishableKey = key) =>
  createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

let admin: SupabaseClient;
let owner: SupabaseClient;
let staff: SupabaseClient;
let other: SupabaseClient;
let outreachId = "";

const atDaysAgo = (days: number) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(10, 0, 0, 0);
  return date;
};

beforeAll(async () => {
  if (!["localhost", "127.0.0.1"].includes(new URL(url).hostname))
    throw new Error("Local only");
  admin = client(process.env.SUPABASE_SERVICE_ROLE_KEY!);
  owner = client();
  staff = client();
  other = client();
  for (const [db, email, password] of [
    [owner, "owner@porto-gentlemen.example", "PortoDemo!2026"],
    [staff, "staff@porto-gentlemen.example", "StaffDemo!2026"],
    [other, "owner@atelier-lisboa.example", "LisboaDemo!2026"],
  ] as const)
    expect(
      (await db.auth.signInWithPassword({ email, password })).error,
    ).toBeNull();

  expect(
    (
      await admin.from("customers").insert({
        id: customer,
        tenant_id: tenant,
        display_name: "Retention outreach fixture",
        email: `retention-${customer}@test.example`,
      })
    ).error,
  ).toBeNull();
  for (const daysAgo of [84, 56, 28]) {
    const id = crypto.randomUUID();
    appointments.push(id);
    const startsAt = atDaysAgo(daysAgo);
    expect(
      (
        await admin.from("appointments").insert({
          id,
          tenant_id: tenant,
          customer_id: customer,
          location_id: location,
          service_id: service,
          staff_id: staffId,
          service_name: "Retention fixture service",
          price_minor: 2800,
          starts_at: startsAt.toISOString(),
          ends_at: new Date(+startsAt + 30 * 60_000).toISOString(),
          blocked_until: new Date(+startsAt + 30 * 60_000).toISOString(),
          status: "completed",
        })
      ).error,
    ).toBeNull();
  }
});

afterAll(async () => {
  await admin
    .from("customer_outreach_actions")
    .delete()
    .eq("customer_id", customer);
  await admin
    .from("customer_consent_events")
    .delete()
    .eq("customer_id", customer);
  await admin.from("appointments").delete().eq("customer_id", customer);
  await admin.from("customers").delete().eq("id", customer);
});

it("explains retention health, enforces consent and attributes a resulting booking", async () => {
  const health = await owner
    .from("customer_retention_health")
    .select(
      "health_status,typical_interval_days,due_in_days,completed_visit_days",
    )
    .eq("id", customer)
    .single();
  expect(health.error).toBeNull();
  expect(health.data).toEqual({
    health_status: "due_soon",
    typical_interval_days: 28,
    due_in_days: 0,
    completed_visit_days: 3,
  });

  const message = "A consented rebooking message sent outside Noma.";
  expect(
    (
      await owner.rpc("record_customer_outreach", {
        p_tenant: tenant,
        p_customer: customer,
        p_message: message,
        p_confirmed: true,
      })
    ).error?.message,
  ).toContain("not opted in");

  for (const db of [staff, other, client()])
    expect(
      (
        await db.rpc("set_customer_marketing_consent", {
          p_tenant: tenant,
          p_customer: customer,
          p_version: 1,
          p_consent: true,
          p_confirmed: true,
        })
      ).error,
    ).not.toBeNull();

  expect(
    (
      await owner.rpc("set_customer_marketing_consent", {
        p_tenant: tenant,
        p_customer: customer,
        p_version: 1,
        p_consent: true,
        p_confirmed: false,
      })
    ).error?.message,
  ).toContain("Confirm");
  expect(
    (
      await owner.rpc("set_customer_marketing_consent", {
        p_tenant: tenant,
        p_customer: customer,
        p_version: 1,
        p_consent: true,
        p_confirmed: true,
      })
    ).error,
  ).toBeNull();

  const outreach = await owner.rpc("record_customer_outreach", {
    p_tenant: tenant,
    p_customer: customer,
    p_message: message,
    p_confirmed: true,
  });
  expect(outreach.error).toBeNull();
  outreachId = outreach.data!;
  expect(
    (
      await owner.rpc("record_customer_outreach", {
        p_tenant: tenant,
        p_customer: customer,
        p_message: message,
        p_confirmed: true,
      })
    ).error?.message,
  ).toContain("last 7 days");

  for (const db of [staff, other])
    expect(
      (
        await db
          .from("customer_outreach_actions")
          .select("id")
          .eq("id", outreachId)
      ).data,
    ).toEqual([]);

  const serviceRow = (
    await owner
      .from("services")
      .select("price_minor,duration_minutes")
      .eq("id", service)
      .single()
  ).data!;
  let start = "";
  for (let day = 3; day < 10; day++) {
    const slots = await owner.rpc("owner_booking_slots", {
      p_tenant: tenant,
      p_service: service,
      p_staff: staffId,
      p_day: addDays(shopDate(), day),
    });
    if (slots.data?.length) {
      start = slots.data[0].starts_at;
      break;
    }
  }
  expect(start).not.toBe("");
  const args = {
    p_tenant: tenant,
    p_customer: customer,
    p_customer_version: 2,
    p_service: service,
    p_staff: staffId,
    p_start: start,
    p_price: serviceRow.price_minor,
    p_duration: serviceRow.duration_minutes,
    p_request: crypto.randomUUID(),
    p_outreach: outreachId,
  };
  const [first, repeated] = await Promise.all([
    owner.rpc("rebook_customer_from_outreach", args),
    owner.rpc("rebook_customer_from_outreach", args),
  ]);
  expect(first.error).toBeNull();
  expect(repeated.error).toBeNull();
  expect(first.data).toBe(repeated.data);
  appointments.push(first.data!);

  expect(
    (
      await owner
        .from("customer_outreach_actions")
        .select("attributed_appointment_id,attributed_at")
        .eq("id", outreachId)
        .single()
    ).data,
  ).toMatchObject({ attributed_appointment_id: first.data });
  expect(
    (await owner.rpc("customer_outreach_summary", { p_tenant: tenant })).data,
  ).toMatchObject({
    outreach_count: 1,
    attributed_bookings: 1,
    attributed_service_value_minor: serviceRow.price_minor,
  });
});
