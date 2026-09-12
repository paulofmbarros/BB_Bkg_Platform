import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
const A = "11111111-1111-4111-8111-111111111111",
  B = "22222222-2222-4222-8222-222222222222";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!,
  key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const client = (credential = key) =>
  createClient(url, credential, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
let admin: SupabaseClient,
  owner: SupabaseClient,
  staff: SupabaseClient,
  other: SupabaseClient;
const id = randomUUID(),
  otherId = randomUUID(),
  duplicateId = randomUUID(),
  email = `profile-${id}@test.example`;
const appointmentIds: string[] = [];
beforeAll(async () => {
  if (!["localhost", "127.0.0.1"].includes(new URL(url).hostname))
    throw new Error("Local tests only");
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
        { id, tenant_id: A, display_name: "Customer history test", email },
        { id: otherId, tenant_id: B, display_name: "Other tenant", email },
        {
          id: duplicateId,
          tenant_id: A,
          display_name: "Separate guest",
          email,
        },
      ])
    ).error,
  ).toBeNull();
  // Two completed visits, one cancelled, one no-show, one upcoming and one pending past.
  for (const [i, status] of [
    "completed",
    "completed",
    "cancelled",
    "no_show",
    "confirmed",
    "confirmed",
  ].entries()) {
    const aid = randomUUID();
    appointmentIds.push(aid);
    const start = new Date(
      i === 4 ? Date.now() + 86400000 * 50 : Date.UTC(2002, 1, i + 1, 9),
    );
    const row = {
      id: aid,
      tenant_id: A,
      location_id: "11111111-1111-4111-8111-111111111112",
      customer_id: id,
      service_id: "10000000-0000-4000-8000-000000000001",
      staff_id:
        i === 0
          ? "30000000-0000-4000-8000-000000000002"
          : "30000000-0000-4000-8000-000000000001",
      service_name: "Historical quoted service",
      price_minor: i === 0 ? 2000 : 3000,
      starts_at: start.toISOString(),
      ends_at: new Date(+start + 1800000).toISOString(),
      blocked_until: new Date(+start + 2100000).toISOString(),
      status,
    };
    expect((await admin.from("appointments").insert(row)).error).toBeNull();
  }
});
afterAll(async () => {
  await admin.from("appointments").delete().in("id", appointmentIds);
  await admin.from("customers").delete().in("id", [id, otherId, duplicateId]);
});
describe("Customer profiles and histories", () => {
  it("calculates totals only from completed visits, without treating price as paid revenue", async () => {
    const { data, error } = await owner
      .from("customer_summaries")
      .select("*")
      .eq("id", id)
      .single();
    expect(error).toBeNull();
    expect(data).toMatchObject({
      appointment_count: 6,
      completed_visits: 2,
      completed_value_minor: 5000,
      average_visit_minor: 2500,
      cancellations: 1,
      no_shows: 1,
      upcoming_visits: 1,
      awaiting_outcome: 1,
    });
    expect(data.last_visit_at).toContain("2002-02-02");
    expect(data.next_visit_at).not.toBeNull();
  });
  it("applies RLS before aggregation and never combines records by matching email", async () => {
    const own = await staff
      .from("customer_summaries")
      .select("*")
      .eq("id", id)
      .single();
    expect(own.error).toBeNull();
    expect(own.data).toMatchObject({
      appointment_count: 1,
      completed_visits: 1,
      completed_value_minor: 2000,
      no_shows: 0,
    });
    expect(
      (await owner.from("customer_summaries").select("*").eq("id", otherId))
        .data,
    ).toEqual([]);
    expect(
      (await other.from("customer_summaries").select("*").eq("id", id)).data,
    ).toEqual([]);
    expect(
      (await staff.from("customer_summaries").select("*").eq("id", duplicateId))
        .data,
    ).toEqual([]);
    expect(
      (
        await owner
          .from("customer_summaries")
          .select("*")
          .eq("id", duplicateId)
          .single()
      ).data?.completed_visits,
    ).toBe(0);
    expect(
      (await client().from("customer_summaries").select("*")).error,
    ).not.toBeNull();
  });
  it("restricts edits to managers, rejects stale edits, and never grants email verification", async () => {
    const args = {
      p_tenant: A,
      p_id: id,
      p_version: 1,
      p_name: "Corrected name",
      p_email: "corrected-profile@test.example",
    };
    expect((await staff.rpc("update_customer", args)).error?.code).toBe(
      "42501",
    );
    expect((await other.rpc("update_customer", args)).error?.code).toBe(
      "42501",
    );
    expect(
      (await owner.rpc("update_customer", { ...args, p_id: otherId })).error,
    ).not.toBeNull();
    await admin.from("customers").update({ email_verified: true }).eq("id", id);
    expect((await owner.rpc("update_customer", args)).error).toBeNull();
    expect(
      (
        await owner
          .from("customers")
          .select("display_name,email_verified,version")
          .eq("id", id)
          .single()
      ).data,
    ).toEqual({
      display_name: "Corrected name",
      email_verified: false,
      version: 2,
    });
    expect((await owner.rpc("update_customer", args)).error?.message).toContain(
      "profile changed",
    );
    expect(
      (
        await owner
          .from("customers")
          .update({ email_verified: true })
          .eq("id", id)
      ).error,
    ).not.toBeNull();
    expect(
      (
        await owner
          .from("audit_events")
          .select("id")
          .eq("entity_id", id)
          .eq("operation", "UPDATE")
      ).data?.length,
    ).toBeGreaterThan(0);
  });
  it("honors membership and entitlement revocations for existing sessions", async () => {
    const {
      data: { user },
    } = await owner.auth.getUser();
    try {
      await admin
        .from("feature_entitlements")
        .update({ enabled: false })
        .eq("tenant_id", A)
        .eq("feature", "foundation");
      expect(
        (
          await owner.rpc("update_customer", {
            p_tenant: A,
            p_id: id,
            p_version: 2,
            p_name: "Denied edit",
            p_email: email,
          })
        ).error?.code,
      ).toBe("42501");
      await admin
        .from("tenant_memberships")
        .update({ active: false })
        .eq("tenant_id", A)
        .eq("user_id", user!.id);
      expect(
        (await owner.from("customer_summaries").select("*").eq("id", id)).data,
      ).toEqual([]);
    } finally {
      await admin
        .from("feature_entitlements")
        .update({ enabled: true })
        .eq("tenant_id", A)
        .eq("feature", "foundation");
      await admin
        .from("tenant_memberships")
        .update({ active: true })
        .eq("tenant_id", A)
        .eq("user_id", user!.id);
    }
  });
});
