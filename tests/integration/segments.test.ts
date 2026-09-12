import { beforeAll, afterAll, it, expect } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!,
  key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  tenant = "11111111-1111-4111-8111-111111111111";
const client = (k = key) =>
  createClient(url, k, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
let admin: SupabaseClient,
  owner: SupabaseClient,
  staff: SupabaseClient,
  other: SupabaseClient;
const id = crypto.randomUUID(),
  duplicate = crypto.randomUUID(),
  email = `segment-${id}@test.example`,
  appointments: string[] = [];
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
        id,
        tenant_id: tenant,
        display_name: "Segment integration",
        email,
      })
    ).error,
  ).toBeNull();
  for (let i = 0; i < 3; i++) {
    const aid = crypto.randomUUID();
    appointments.push(aid);
    const start = new Date(Date.now() - (80 + i * 30) * 86400000);
    expect(
      (
        await admin.from("appointments").insert({
          id: aid,
          tenant_id: tenant,
          customer_id: id,
          location_id: "11111111-1111-4111-8111-111111111112",
          service_id: "10000000-0000-4000-8000-000000000001",
          staff_id: "30000000-0000-4000-8000-000000000001",
          service_name: "Segment fixture",
          price_minor: 2800,
          starts_at: start.toISOString(),
          ends_at: new Date(+start + 600000).toISOString(),
          blocked_until: new Date(+start + 600000).toISOString(),
          status: "completed",
        })
      ).error,
    ).toBeNull();
  }
});
afterAll(async () => {
  await admin.from("appointments").delete().in("id", appointments);
  await admin.from("customers").delete().in("id", [id, duplicate]);
});
it("classifies and counts the entire matching set while preserving tenant and manager scope", async () => {
  const result = await owner
    .from("customer_segments")
    .select("segment,days_since_visit")
    .eq("id", id)
    .single();
  expect(result.error).toBeNull();
  expect(result.data?.segment).toBe("at_risk");
  expect(result.data?.days_since_visit).toBeGreaterThanOrEqual(79);
  expect(
    (
      await owner.rpc("customer_segment_counts", {
        p_tenant: tenant,
        p_query: email,
      })
    ).data,
  ).toEqual([{ segment: "at_risk", count: 1 }]);
  for (const db of [staff, other]) {
    expect(
      (await db.from("customer_segments").select("*").eq("id", id)).data,
    ).toEqual([]);
    expect(
      (await db.rpc("customer_segment_counts", { p_tenant: tenant })).data,
    ).toEqual([]);
  }
  expect(
    (await client().from("customer_segments").select("*")).error,
  ).not.toBeNull();
});
it("suppresses risk for upcoming bookings and puts unresolved duplicates ahead of labels", async () => {
  const old = (
    await admin
      .from("appointments")
      .select("*")
      .eq("id", appointments[0])
      .single()
  ).data!;
  const aid = crypto.randomUUID();
  appointments.push(aid);
  const start = new Date(Date.now() + 50 * 86400000);
  start.setUTCHours(2, 1, 0, 0);
  expect(
    (
      await admin.from("appointments").insert({
        ...old,
        id: aid,
        starts_at: start.toISOString(),
        ends_at: new Date(+start + 600000).toISOString(),
        blocked_until: new Date(+start + 600000).toISOString(),
        status: "confirmed",
      })
    ).error,
  ).toBeNull();
  expect(
    (
      await owner
        .from("customer_segments")
        .select("segment")
        .eq("id", id)
        .single()
    ).data?.segment,
  ).toBe("regular");
  await admin.from("customers").insert({
    id: duplicate,
    tenant_id: tenant,
    display_name: "Unresolved guest",
    email,
  });
  expect(
    (
      await owner
        .from("customer_segments")
        .select("segment")
        .eq("id", id)
        .single()
    ).data?.segment,
  ).toBe("needs_review");
  expect(
    (
      await owner.rpc("customer_segment_counts", {
        p_tenant: tenant,
        p_query: email,
      })
    ).data,
  ).toEqual([{ segment: "needs_review", count: 2 }]);
});
