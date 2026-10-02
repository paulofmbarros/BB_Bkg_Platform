import { afterAll, beforeAll, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { addDays, shopDate } from "../../src/modules/bookings/types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const tenant = "11111111-1111-4111-8111-111111111111";
const service = "10000000-0000-4000-8000-000000000001";
const staffId = "30000000-0000-4000-8000-000000000001";
const targetCustomer = crypto.randomUUID();
const sourceCustomer = crypto.randomUUID();
const appointments: string[] = [];
let waitlist = "";
let recoveryAction = "";

const client = (publishableKey = key) =>
  createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

let admin: SupabaseClient;
let owner: SupabaseClient;
let staff: SupabaseClient;
let other: SupabaseClient;
let start = "";
let serviceRow: { price_minor: number; duration_minutes: number };

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
      await admin.from("customers").insert([
        {
          id: targetCustomer,
          tenant_id: tenant,
          display_name: "Recovery waitlist fixture",
          email: `recovery-target-${targetCustomer}@test.example`,
        },
        {
          id: sourceCustomer,
          tenant_id: tenant,
          display_name: "Recovery cancellation fixture",
          email: `recovery-source-${sourceCustomer}@test.example`,
        },
      ])
    ).error,
  ).toBeNull();

  expect(
    (
      await owner.rpc("set_customer_marketing_consent", {
        p_tenant: tenant,
        p_customer: targetCustomer,
        p_version: 1,
        p_consent: true,
        p_confirmed: true,
      })
    ).error,
  ).toBeNull();

  serviceRow = (
    await owner
      .from("services")
      .select("price_minor,duration_minutes")
      .eq("id", service)
      .single()
  ).data!;
  for (let day = 3; day < 12; day++) {
    const slots = await owner.rpc("owner_booking_slots", {
      p_tenant: tenant,
      p_service: service,
      p_staff: staffId,
      p_day: addDays(shopDate(), day),
    });
    if (slots.data?.length) {
      start = slots.data.at(-1).starts_at;
      break;
    }
  }
  expect(start).not.toBe("");

  const source = await owner.rpc("rebook_customer", {
    p_tenant: tenant,
    p_customer: sourceCustomer,
    p_customer_version: 1,
    p_service: service,
    p_staff: staffId,
    p_start: start,
    p_price: serviceRow.price_minor,
    p_duration: serviceRow.duration_minutes,
    p_request: crypto.randomUUID(),
  });
  expect(source.error).toBeNull();
  appointments.push(source.data!);
  expect(
    (
      await owner.rpc("owner_booking_change", {
        p_tenant: tenant,
        p_id: source.data!,
        p_version: 1,
        p_action: "cancel",
      })
    ).error,
  ).toBeNull();
});

afterAll(async () => {
  if (recoveryAction)
    await admin
      .from("waitlist_recovery_actions")
      .delete()
      .eq("id", recoveryAction);
  if (waitlist)
    await admin.from("waitlist_entries").delete().eq("id", waitlist);
  await admin.from("appointments").delete().in("id", appointments);
  await admin
    .from("customer_consent_events")
    .delete()
    .eq("customer_id", targetCustomer);
  await admin
    .from("customers")
    .delete()
    .in("id", [targetCustomer, sourceCustomer]);
});

it("matches a cancelled slot and attributes an exact-slot recovery booking", async () => {
  const day = shopDate(new Date(start));
  const created = await owner.rpc("create_waitlist_entry", {
    p_tenant: tenant,
    p_customer: targetCustomer,
    p_service: service,
    p_staff: staffId,
    p_earliest: day,
    p_latest: day,
  });
  expect(created.error).toBeNull();
  waitlist = created.data!;

  const match = await owner
    .from("revenue_recovery_opportunities")
    .select("*")
    .eq("waitlist_entry_id", waitlist)
    .single();
  expect(match.error).toBeNull();
  expect(match.data).toMatchObject({
    customer_id: targetCustomer,
    service_id: service,
    staff_id: staffId,
    starts_at: start,
    match_reason: "Service, preferred team member and date window match",
  });

  for (const db of [staff, other]) {
    expect(
      (
        await db
          .from("revenue_recovery_opportunities")
          .select("waitlist_entry_id")
          .eq("waitlist_entry_id", waitlist)
      ).data,
    ).toEqual([]);
    expect(
      (
        await db.rpc("record_waitlist_recovery_contact", {
          p_tenant: tenant,
          p_entry: waitlist,
          p_source: appointments[0],
          p_message: "Unauthorized recovery contact",
          p_confirmed: true,
        })
      ).error,
    ).not.toBeNull();
  }

  const contacted = await owner.rpc("record_waitlist_recovery_contact", {
    p_tenant: tenant,
    p_entry: waitlist,
    p_source: appointments[0],
    p_message: "A consented cancellation recovery message sent outside Noma.",
    p_confirmed: true,
  });
  expect(contacted.error).toBeNull();
  recoveryAction = contacted.data!;

  const request = crypto.randomUUID();
  const recovered = await owner.rpc("book_waitlist_recovery", {
    p_tenant: tenant,
    p_action: recoveryAction,
    p_request: request,
  });
  expect(recovered.error).toBeNull();
  appointments.push(recovered.data!);
  const repeated = await owner.rpc("book_waitlist_recovery", {
    p_tenant: tenant,
    p_action: recoveryAction,
    p_request: request,
  });
  expect(repeated.error).toBeNull();
  expect(repeated.data).toBe(recovered.data);

  expect(
    (
      await owner
        .from("appointments")
        .select("customer_id,starts_at,status")
        .eq("id", recovered.data!)
        .single()
    ).data,
  ).toEqual({
    customer_id: targetCustomer,
    starts_at: start,
    status: "confirmed",
  });
  expect(
    (
      await owner
        .from("waitlist_entries")
        .select("status,closed_at")
        .eq("id", waitlist)
        .single()
    ).data,
  ).toMatchObject({ status: "booked" });
  expect(
    (await owner.rpc("revenue_recovery_summary", { p_tenant: tenant })).data,
  ).toMatchObject({
    bookings_attributed: 1,
    booked_service_value_minor: serviceRow.price_minor,
    completed_recovered_value_minor: 0,
  });
});

it("requires current consent before creating a waitlist request", async () => {
  expect(
    (
      await owner.rpc("create_waitlist_entry", {
        p_tenant: tenant,
        p_customer: sourceCustomer,
        p_service: service,
        p_staff: null as unknown as string,
        p_earliest: addDays(shopDate(), 1),
        p_latest: addDays(shopDate(), 2),
      })
    ).error?.message,
  ).toContain("consent");
});
