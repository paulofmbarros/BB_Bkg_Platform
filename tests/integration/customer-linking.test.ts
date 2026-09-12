import { beforeAll, afterAll, it, expect } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomBytes, randomUUID } from "node:crypto";
import { addDays, shopDate } from "../../src/modules/bookings/types";
const A = "11111111-1111-4111-8111-111111111111",
  B = "22222222-2222-4222-8222-222222222222",
  host = "porto-gentlemen.localhost";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!,
  key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const client = (k = key) =>
  createClient(url, k, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
let admin: SupabaseClient,
  owner: SupabaseClient,
  staff: SupabaseClient,
  guest: SupabaseClient,
  source: string,
  aid: string,
  linkId: string;
const target = randomUUID(),
  foreign = randomUUID(),
  cap = randomBytes(32).toString("hex");
async function review() {
  const s = await owner
      .from("customer_summaries")
      .select("*")
      .eq("id", source)
      .single(),
    t = await owner
      .from("customer_summaries")
      .select("*")
      .eq("id", target)
      .single();
  expect(s.error).toBeNull();
  expect(t.error).toBeNull();
  return {
    p_tenant: A,
    p_source: source,
    p_target: target,
    p_source_version: s.data!.version,
    p_target_version: t.data!.version,
    p_source_revision: s.data!.history_revision,
    p_target_revision: t.data!.history_revision,
    p_confirmation: "customer_confirmed",
  };
}
beforeAll(async () => {
  if (!["127.0.0.1", "localhost"].includes(new URL(url).hostname))
    throw new Error("Local tests only");
  admin = client(process.env.SUPABASE_SERVICE_ROLE_KEY!);
  owner = client();
  staff = client();
  guest = client();
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
          id: target,
          tenant_id: A,
          display_name: "Retained private name",
          email: `target-${target}@test.example`,
          marketing_consent: false,
        },
        {
          id: foreign,
          tenant_id: B,
          display_name: "Other tenant target",
          marketing_consent: false,
          email: `foreign-${foreign}@test.example`,
        },
      ])
    ).error,
  ).toBeNull();
  for (let i = 3; i < 10; i++) {
    const slots = await guest.rpc("booking_slots", {
      p_host: host,
      p_service: "10000000-0000-4000-8000-000000000001",
      p_staff: "30000000-0000-4000-8000-000000000001",
      p_day: addDays(shopDate(), i),
    });
    if (slots.data?.length) {
      const booked = await guest.rpc("create_booking", {
        p_host: host,
        p_service: "10000000-0000-4000-8000-000000000001",
        p_staff: "30000000-0000-4000-8000-000000000001",
        p_start: slots.data[0].starts_at,
        p_name: "Original guest name",
        p_email: `source-${target}@test.example`,
        p_token: cap,
      });
      expect(booked.error).toBeNull();
      aid = booked.data;
      break;
    }
  }
  source = (
    await admin
      .from("appointments")
      .select("customer_id")
      .eq("id", aid)
      .single()
  ).data!.customer_id;
});
afterAll(async () => {
  await admin.from("customer_links").delete().eq("source_id", source);
  await admin.from("appointments").delete().eq("id", aid);
  await admin
    .from("customers")
    .update({ linked_customer_id: null })
    .eq("id", source);
  await admin.from("customers").delete().in("id", [source, target, foreign]);
});
it("rejects unauthorized, cross-tenant, unconfirmed and stale reviews", async () => {
  const args = await review();
  expect((await staff.rpc("link_customers", args)).error?.code).toBe("42501");
  expect((await guest.rpc("link_customers", args)).error).not.toBeNull();
  expect(
    (await owner.rpc("link_customers", { ...args, p_target: foreign })).error,
  ).not.toBeNull();
  expect(
    (await owner.rpc("link_customers", { ...args, p_confirmation: "" })).error,
  ).not.toBeNull();
  await owner.rpc("update_customer", {
    p_tenant: A,
    p_id: source,
    p_version: args.p_source_version,
    p_name: "Reviewed guest name",
    p_email: `source-${target}@test.example`,
  });
  expect((await owner.rpc("link_customers", args)).error?.message).toContain(
    "changed",
  );
  const fresh = await review();
  await admin.from("appointments").update({ version: 2 }).eq("id", aid);
  expect((await owner.rpc("link_customers", fresh)).error?.message).toContain(
    "changed",
  );
});
it("links once under concurrency, preserves consent and keeps guest access appointment-scoped", async () => {
  const args = await review();
  const results = await Promise.all([
    owner.rpc("link_customers", args),
    owner.rpc("link_customers", args),
  ]);
  expect(results.filter((r) => !r.error)).toHaveLength(1);
  linkId = results.find((r) => !r.error)!.data;
  expect(
    (await owner.from("customer_summaries").select("id").eq("id", source)).data,
  ).toEqual([]);
  const retained = await owner
    .from("customer_summaries")
    .select("*")
    .eq("id", target)
    .single();
  expect(retained.data).toMatchObject({
    appointment_count: 1,
    marketing_consent: false,
    email_verified: false,
    display_name: "Retained private name",
  });
  const receipt = await guest.rpc("manage_booking", {
    p_host: host,
    p_token: cap,
  });
  expect(receipt.error).toBeNull();
  expect(receipt.data.customer_name).toBe("Original guest name");
  expect(receipt.data).not.toHaveProperty("email");
  expect(receipt.data).not.toHaveProperty("customer_id");
  expect((await staff.from("customer_links").select("*")).data).toEqual([]);
  expect(
    (
      await owner
        .from("customers")
        .update({ linked_customer_id: target })
        .eq("id", source)
    ).error,
  ).not.toBeNull();
  const cancel = await guest.rpc("manage_booking", {
    p_host: host,
    p_token: cap,
    p_action: "cancel",
    p_version: receipt.data.version,
  });
  expect(cancel.error).toBeNull();
});
it("undo restores original membership of appointments without reverting appointment changes", async () => {
  expect(
    (await staff.rpc("undo_customer_link", { p_tenant: A, p_link: linkId }))
      .error?.code,
  ).toBe("42501");
  expect(
    (await owner.rpc("undo_customer_link", { p_tenant: A, p_link: linkId }))
      .error,
  ).toBeNull();
  const a = await owner
    .from("appointments")
    .select("customer_id,status")
    .eq("id", aid)
    .single();
  expect(a.data).toEqual({ customer_id: source, status: "cancelled" });
  expect(
    (
      await owner
        .from("customer_summaries")
        .select("appointment_count")
        .eq("id", source)
        .single()
    ).data!.appointment_count,
  ).toBe(1);
  expect(
    (
      await owner
        .from("customer_summaries")
        .select("appointment_count")
        .eq("id", target)
        .single()
    ).data!.appointment_count,
  ).toBe(0);
  expect(
    (await owner.rpc("undo_customer_link", { p_tenant: A, p_link: linkId }))
      .error,
  ).not.toBeNull();
});
