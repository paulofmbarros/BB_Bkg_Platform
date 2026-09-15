import { afterAll, beforeAll, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const tenant = "11111111-1111-4111-8111-111111111111";
const location = "11111111-1111-4111-8111-111111111112";
const service = "10000000-0000-4000-8000-000000000001";
const customer = crypto.randomUUID();
const duplicate = crypto.randomUUID();
const staff = crypto.randomUUID();
const email = `opportunity-${customer}@test.example`;
const appointments: string[] = [];
const client = (publishableKey = key) =>
  createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

let admin: SupabaseClient;
let owner: SupabaseClient;
let staffUser: SupabaseClient;
let otherOwner: SupabaseClient;
let baseline = { count: 0, potential_value_minor: 0 };

const atDaysAgo = (days: number) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(10, 17, 0, 0);
  return date;
};

beforeAll(async () => {
  if (!["localhost", "127.0.0.1"].includes(new URL(url).hostname))
    throw new Error("Local only");
  admin = client(process.env.SUPABASE_SERVICE_ROLE_KEY!);
  owner = client();
  staffUser = client();
  otherOwner = client();
  for (const [db, account, password] of [
    [owner, "owner@porto-gentlemen.example", "PortoDemo!2026"],
    [staffUser, "staff@porto-gentlemen.example", "StaffDemo!2026"],
    [otherOwner, "owner@atelier-lisboa.example", "LisboaDemo!2026"],
  ] as const)
    expect(
      (await db.auth.signInWithPassword({ email: account, password })).error,
    ).toBeNull();

  const startingSummary = await owner.rpc(
    "customer_rebooking_opportunity_summary",
    { p_tenant: tenant },
  );
  expect(startingSummary.error).toBeNull();
  baseline = startingSummary.data as typeof baseline;

  expect(
    (
      await admin.from("staff_members").insert({
        id: staff,
        tenant_id: tenant,
        display_name: "Opportunity fixture barber",
      })
    ).error,
  ).toBeNull();
  expect(
    (
      await admin.from("customers").insert({
        id: customer,
        tenant_id: tenant,
        display_name: "Opportunity fixture customer",
        email,
      })
    ).error,
  ).toBeNull();

  for (const [index, daysAgo] of [80, 52, 24].entries()) {
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
          staff_id: staff,
          service_name: "Opportunity service",
          price_minor: index === 2 ? 3200 : 2800,
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
  await admin.from("customers").delete().eq("id", duplicate);
  await admin.from("appointments").delete().in("id", appointments);
  await admin.from("customers").delete().eq("id", customer);
  await admin.from("staff_members").delete().eq("id", staff);
});

it("uses median completed-visit cadence and the latest service value", async () => {
  const result = await owner
    .from("customer_rebooking_opportunities")
    .select("*")
    .eq("id", customer)
    .single();
  expect(result.error).toBeNull();
  expect(result.data).toMatchObject({
    completed_visit_days: 3,
    typical_interval_days: 28,
    days_since_visit: 24,
    due_in_days: 4,
    service_name: "Opportunity service",
    potential_value_minor: 3200,
    staff_name: "Opportunity fixture barber",
  });
  const summary = await owner.rpc("customer_rebooking_opportunity_summary", {
    p_tenant: tenant,
  });
  expect(summary.error).toBeNull();
  expect(summary.data).toEqual({
    count: baseline.count + 1,
    potential_value_minor: baseline.potential_value_minor + 3200,
  });
});

it("preserves manager scope and excludes future bookings and duplicate identities", async () => {
  for (const db of [staffUser, otherOwner]) {
    expect(
      (
        await db
          .from("customer_rebooking_opportunities")
          .select("id")
          .eq("id", customer)
      ).data,
    ).toEqual([]);
    expect(
      (
        await db.rpc("customer_rebooking_opportunity_summary", {
          p_tenant: tenant,
        })
      ).data,
    ).toEqual({ count: 0, potential_value_minor: 0 });
  }
  expect(
    (await client().from("customer_rebooking_opportunities").select("id"))
      .error,
  ).not.toBeNull();

  const previous = (
    await admin
      .from("appointments")
      .select("*")
      .eq("id", appointments[2])
      .single()
  ).data!;
  const futureId = crypto.randomUUID();
  appointments.push(futureId);
  const future = atDaysAgo(-14);
  expect(
    (
      await admin.from("appointments").insert({
        ...previous,
        id: futureId,
        starts_at: future.toISOString(),
        ends_at: new Date(+future + 30 * 60_000).toISOString(),
        blocked_until: new Date(+future + 30 * 60_000).toISOString(),
        status: "confirmed",
      })
    ).error,
  ).toBeNull();
  expect(
    (
      await owner
        .from("customer_rebooking_opportunities")
        .select("id")
        .eq("id", customer)
    ).data,
  ).toEqual([]);

  await admin.from("appointments").delete().eq("id", futureId);
  expect(
    (
      await admin.from("customers").insert({
        id: duplicate,
        tenant_id: tenant,
        display_name: "Possible duplicate",
        email,
      })
    ).error,
  ).toBeNull();
  expect(
    (
      await owner
        .from("customer_rebooking_opportunities")
        .select("id")
        .eq("id", customer)
    ).data,
  ).toEqual([]);
});
