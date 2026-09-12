import { beforeAll, afterAll, it, expect } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { addDays, shopDate } from "../../src/modules/bookings/types";
const tenant = "11111111-1111-4111-8111-111111111111",
  service = "10000000-0000-4000-8000-000000000001",
  staffId = "30000000-0000-4000-8000-000000000001",
  customer = randomUUID(),
  otherCustomer = randomUUID();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!,
  key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const client = (k = key) =>
  createClient(url, k, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
let admin: SupabaseClient, owner: SupabaseClient, staff: SupabaseClient;
let args: {
  p_tenant: string;
  p_customer: string;
  p_customer_version: number;
  p_service: string;
  p_staff: string;
  p_start: string;
  p_price: number;
  p_duration: number;
  p_request: string;
};
beforeAll(async () => {
  if (!["127.0.0.1", "localhost"].includes(new URL(url).hostname))
    throw new Error("Local only");
  admin = client(process.env.SUPABASE_SERVICE_ROLE_KEY!);
  owner = client();
  staff = client();
  for (const [db, email, password] of [
    [owner, "owner@porto-gentlemen.example", "PortoDemo!2026"],
    [staff, "staff@porto-gentlemen.example", "StaffDemo!2026"],
  ] as const)
    expect(
      (await db.auth.signInWithPassword({ email, password })).error,
    ).toBeNull();
  expect(
    (
      await admin.from("customers").insert([
        {
          id: customer,
          tenant_id: tenant,
          display_name: "Rebooking test",
          email: `rebooking-${customer}@test.example`,
        },
        {
          id: otherCustomer,
          tenant_id: "22222222-2222-4222-8222-222222222222",
          display_name: "Other shop",
          email: `other-${customer}@test.example`,
        },
      ])
    ).error,
  ).toBeNull();
  const s = (
    await owner
      .from("services")
      .select("price_minor,duration_minutes")
      .eq("id", service)
      .single()
  ).data!;
  for (let i = 3; i < 10; i++) {
    const slots = await owner.rpc("owner_booking_slots", {
      p_tenant: tenant,
      p_service: service,
      p_staff: staffId,
      p_day: addDays(shopDate(), i),
    });
    expect(slots.error).toBeNull();
    if (slots.data?.length) {
      args = {
        p_tenant: tenant,
        p_customer: customer,
        p_customer_version: 1,
        p_service: service,
        p_staff: staffId,
        p_start: slots.data[0].starts_at,
        p_price: s.price_minor,
        p_duration: s.duration_minutes,
        p_request: randomUUID(),
      };
      break;
    }
  }
});
afterAll(async () => {
  await admin.from("appointments").delete().eq("customer_id", customer);
  await admin.from("customers").delete().in("id", [customer, otherCustomer]);
});
it("rejects staff, anonymous callers, other-tenant customers and stale profile/quote data", async () => {
  expect((await staff.rpc("rebook_customer", args)).error?.code).toBe("42501");
  expect((await client().rpc("rebook_customer", args)).error).not.toBeNull();
  expect(
    (await owner.rpc("rebook_customer", { ...args, p_customer: otherCustomer }))
      .error,
  ).not.toBeNull();
  expect(
    (await owner.rpc("rebook_customer", { ...args, p_customer_version: 999 }))
      .error?.message,
  ).toContain("changed");
  expect(
    (await owner.rpc("rebook_customer", { ...args, p_price: 1 })).error
      ?.message,
  ).toContain("changed");
  try {
    await admin
      .from("feature_entitlements")
      .update({ enabled: false })
      .eq("tenant_id", tenant)
      .eq("feature", "booking");
    expect((await owner.rpc("rebook_customer", args)).error?.code).toBe(
      "42501",
    );
  } finally {
    await admin
      .from("feature_entitlements")
      .update({ enabled: true })
      .eq("tenant_id", tenant)
      .eq("feature", "booking");
  }
});
it("books once on the original customer and repeats safely without duplicate profiles", async () => {
  const before = await admin
    .from("customers")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenant);
  const results = await Promise.all([
    owner.rpc("rebook_customer", args),
    owner.rpc("rebook_customer", args),
  ]);
  expect(results[0].error).toBeNull();
  expect(results[1].error).toBeNull();
  expect(results[0].data).toBe(results[1].data);
  const a = await owner
    .from("appointments")
    .select("customer_id,price_minor,status")
    .eq("id", results[0].data)
    .single();
  expect(a.data).toEqual({
    customer_id: customer,
    price_minor: args.p_price,
    status: "confirmed",
  });
  expect(
    (
      await owner
        .from("customer_summaries")
        .select("upcoming_visits,completed_visits")
        .eq("id", customer)
        .single()
    ).data,
  ).toEqual({ upcoming_visits: 1, completed_visits: 0 });
  expect(
    (
      await admin
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenant)
    ).count,
  ).toBe(before.count);
  expect(
    (await owner.rpc("rebook_customer", { ...args, p_price: args.p_price + 1 }))
      .error,
  ).not.toBeNull();
});
it("rejects another booking request for the occupied slot", async () => {
  expect(
    (await owner.rpc("rebook_customer", { ...args, p_request: randomUUID() }))
      .error?.message,
  ).toContain("no longer available");
});
