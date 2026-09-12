import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { addDays, shopDate } from "../../src/modules/bookings/types";
const A = "11111111-1111-4111-8111-111111111111";
const service = "10000000-0000-4000-8000-000000000001",
  barber = "30000000-0000-4000-8000-000000000001",
  host = "porto-gentlemen.localhost";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!,
  key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const client = (keyOverride = key) =>
  createClient(url, keyOverride, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
let anon: SupabaseClient,
  admin: SupabaseClient,
  owner: SupabaseClient,
  staff: SupabaseClient,
  other: SupabaseClient;
const created: string[] = [];
const token = () => randomBytes(32).toString("hex");
const email = `booking-${Date.now()}@test.example`;
let day: string;
async function slots(date = day, staffId = barber) {
  const r = await anon.rpc("booking_slots", {
    p_host: host,
    p_service: service,
    p_staff: staffId,
    p_day: date,
  });
  expect(r.error).toBeNull();
  return r.data as { starts_at: string; ends_at: string }[];
}
async function book(
  start: string,
  cap = token(),
  staffId = barber,
  emailAddress = `${token().slice(0, 8)}-${email}`,
) {
  const args = {
    p_host: host,
    p_service: service,
    p_staff: staffId,
    p_start: start,
    p_name: "Synthetic booking test",
    p_email: emailAddress,
    p_token: cap,
  };
  const result = await anon.rpc("create_booking", args);
  if (result.data) created.push(result.data);
  return { ...result, cap, args };
}
beforeAll(async () => {
  if (!["127.0.0.1", "localhost"].includes(new URL(url).hostname))
    throw new Error("Local tests only");
  anon = client();
  admin = client(process.env.SUPABASE_SERVICE_ROLE_KEY!);
  owner = client();
  staff = client();
  other = client();
  for (const [db, email, password] of [
    [owner, "owner@porto-gentlemen.example", "PortoDemo!2026"],
    [staff, "staff@porto-gentlemen.example", "StaffDemo!2026"],
    [other, "owner@atelier-lisboa.example", "LisboaDemo!2026"],
  ] as const) {
    expect(
      (await db.auth.signInWithPassword({ email, password })).error,
    ).toBeNull();
  }
  for (let i = 2; i < 9; i++) {
    const d = addDays(shopDate(), i);
    if ((await slots(d)).length > 5) {
      day = d;
      break;
    }
  }
  expect(day).toBeTruthy();
});
afterAll(async () => {
  if (created.length) {
    const rows = await admin
      .from("appointments")
      .select("customer_id")
      .in("id", created);
    await admin.from("appointments").delete().in("id", created);
    await admin
      .from("customers")
      .delete()
      .in("id", rows.data?.map((a) => a.customer_id) ?? []);
  }
});
describe("Booking integrity", () => {
  it("excludes breaks, buffers, closed days and unassigned/cross-tenant staff", async () => {
    const available = await slots();
    expect(available.length).toBeGreaterThan(0);
    for (const slot of available) {
      const local = new Date(slot.starts_at).toLocaleTimeString("en-GB", {
        timeZone: "Europe/Lisbon",
      });
      expect(local >= "09:00:00" && local < "19:00:00").toBe(true);
      expect(local < "13:00:00" || local >= "14:00:00").toBe(true);
    }
    const invalid = await anon.rpc("booking_slots", {
      p_host: host,
      p_service: service,
      p_staff: "40000000-0000-4000-8000-000000000001",
      p_day: day,
    });
    expect(invalid.data).toEqual([]);
    const tooFar = await slots(addDays(shopDate(), 91));
    expect(tooFar).toEqual([]);
    const forged = await anon.rpc("booking_slots", {
      p_host: "unknown.example",
      p_service: service,
      p_staff: barber,
      p_day: day,
    });
    expect(forged.data).toEqual([]);
  });
  it("allows exactly one winner in a concurrent race and snapshots price", async () => {
    const start = (await slots())[0].starts_at;
    const results = await Promise.all([book(start), book(start)]);
    expect(results.filter((r) => !r.error)).toHaveLength(1);
    expect(results.filter((r) => r.error)).toHaveLength(1);
    const row = await owner
      .from("appointments")
      .select("*")
      .eq("id", results.find((r) => !r.error)!.data)
      .single();
    const svc = await owner
      .from("services")
      .select("price_minor")
      .eq("id", service)
      .single();
    expect(row.data.price_minor).toBe(svc.data!.price_minor);
    expect((await slots()).some((s) => s.starts_at === start)).toBe(false);
  });
  it("retries idempotently but rejects changed content under the same key", async () => {
    const result = await book((await slots())[0].starts_at);
    expect(result.error).toBeNull();
    const repeated = await anon.rpc("create_booking", result.args);
    expect(repeated.data).toBe(result.data);
    expect(repeated.error).toBeNull();
    const altered = await anon.rpc("create_booking", {
      ...result.args,
      p_name: "Different name",
    });
    expect(altered.error).not.toBeNull();
  });
  it("keeps guests, other tenants, and staff away from unrelated private records", async () => {
    const result = await book(
      (await slots(day, barber))[0].starts_at,
      token(),
      barber,
    );
    expect(result.error).toBeNull();
    expect((await anon.from("appointments").select("*")).error).not.toBeNull();
    expect(
      (await other.from("appointments").select("*").eq("id", result.data)).data,
    ).toEqual([]);
    expect(
      (await staff.from("appointments").select("*").eq("id", result.data)).data,
    ).toEqual([]);
    const row = await owner
      .from("appointments")
      .select("customer_id")
      .eq("id", result.data)
      .single();
    expect(
      (
        await staff
          .from("customers")
          .select("*")
          .eq("id", row.data!.customer_id)
      ).data,
    ).toEqual([]);
    expect(
      (
        await anon.rpc("manage_booking", {
          p_host: "atelier-lisboa.localhost",
          p_token: result.cap,
        })
      ).error,
    ).not.toBeNull();
    expect(
      (await anon.rpc("manage_booking", { p_host: host, p_token: token() }))
        .error,
    ).not.toBeNull();
    expect(
      (
        await other.rpc("owner_booking_change", {
          p_tenant: A,
          p_id: result.data,
          p_version: 1,
          p_action: "cancel",
        })
      ).error?.code,
    ).toBe("42501");
    expect(
      (
        await owner
          .from("appointments")
          .update({ price_minor: 1 })
          .eq("id", result.data)
      ).error,
    ).not.toBeNull();
  });
  it("reschedules atomically, rejects stale versions, and releases cancelled slots", async () => {
    const result = await book((await slots())[0].starts_at);
    expect(result.error).toBeNull();
    const next = (await slots())[0].starts_at;
    const moved = await anon.rpc("manage_booking", {
      p_host: host,
      p_token: result.cap,
      p_action: "reschedule",
      p_version: 1,
      p_start: next,
    });
    expect(moved.error).toBeNull();
    expect(moved.data.version).toBe(2);
    expect(new Date(moved.data.starts_at).toISOString()).toBe(
      new Date(next).toISOString(),
    );
    const stale = await anon.rpc("manage_booking", {
      p_host: host,
      p_token: result.cap,
      p_action: "cancel",
      p_version: 1,
    });
    expect(stale.error).not.toBeNull();
    const cancelled = await anon.rpc("manage_booking", {
      p_host: host,
      p_token: result.cap,
      p_action: "cancel",
      p_version: 2,
    });
    expect(cancelled.error).toBeNull();
    expect(cancelled.data.status).toBe("cancelled");
    expect((await slots()).some((s) => s.starts_at === next)).toBe(true);
  });
  it("rejects stale availability after a closure and revoked booking entitlement", async () => {
    const start = (await slots())[0].starts_at;
    const closure = await owner
      .from("availability_exceptions")
      .insert({
        tenant_id: A,
        location_id: "11111111-1111-4111-8111-111111111112",
        staff_id: barber,
        start_date: day,
        end_date: day,
        reason: "Booking test closure",
      })
      .select("id")
      .single();
    expect(closure.error).toBeNull();
    try {
      expect(await slots()).toEqual([]);
      expect((await book(start)).error).not.toBeNull();
    } finally {
      await owner
        .from("availability_exceptions")
        .delete()
        .eq("id", closure.data!.id);
    }
    try {
      await admin
        .from("feature_entitlements")
        .update({ enabled: false })
        .eq("tenant_id", A)
        .eq("feature", "booking");
      expect(await slots()).toEqual([]);
      expect((await book(start)).error).not.toBeNull();
    } finally {
      await admin
        .from("feature_entitlements")
        .update({ enabled: true })
        .eq("tenant_id", A)
        .eq("feature", "booking");
    }
  });
  it("database exclusion rejects overlapping direct inserts including buffer", async () => {
    const result = await book((await slots())[0].starts_at);
    expect(result.error).toBeNull();
    const row = (
      await admin
        .from("appointments")
        .select("*")
        .eq("id", result.data)
        .single()
    ).data;
    const conflict = await admin.from("appointments").insert({
      ...row,
      id: crypto.randomUUID(),
      starts_at: row.ends_at,
      ends_at: new Date(
        new Date(row.blocked_until).getTime() + 30 * 60000,
      ).toISOString(),
      blocked_until: new Date(
        new Date(row.blocked_until).getTime() + 35 * 60000,
      ).toISOString(),
    });
    expect(conflict.error?.code).toBe("23P01");
  });
  it("rejects a stale displayed quote without creating a customer or appointment", async () => {
    const start = (await slots())[0].starts_at;
    const result = await anon.rpc("create_booking", {
      p_host: host,
      p_service: service,
      p_staff: barber,
      p_start: start,
      p_name: "Quote test",
      p_email: "quote-test@test.example",
      p_token: token(),
      p_quote: { price_minor: 1, duration_minutes: 45 },
    });
    expect(result.error?.message).toContain("service details changed");
    expect(
      (
        await admin
          .from("customers")
          .select("id")
          .eq("email", "quote-test@test.example")
      ).data,
    ).toEqual([]);
  });
  it("only managers can record completed visits and no-shows, after the visit time", async () => {
    const result = await book((await slots())[0].starts_at);
    expect(result.error).toBeNull();
    const args = {
      p_tenant: A,
      p_id: result.data,
      p_version: 1,
      p_action: "complete",
    };
    expect(
      (await owner.rpc("owner_booking_change", args)).error,
    ).not.toBeNull();
    await admin
      .from("appointments")
      .update({
        starts_at: "2000-01-01T09:00:00Z",
        ends_at: "2000-01-01T09:45:00Z",
        blocked_until: "2000-01-01T09:50:00Z",
      })
      .eq("id", result.data);
    expect((await staff.rpc("owner_booking_change", args)).error?.code).toBe(
      "42501",
    );
    expect((await owner.rpc("owner_booking_change", args)).error).toBeNull();
    expect(
      (
        await owner
          .from("appointments")
          .select("status")
          .eq("id", result.data)
          .single()
      ).data!.status,
    ).toBe("completed");
    expect(
      (
        await owner.rpc("owner_booking_change", {
          ...args,
          p_version: 2,
          p_action: "no_show",
        })
      ).error,
    ).not.toBeNull();
    const second = await book((await slots())[0].starts_at);
    expect(second.error).toBeNull();
    await admin
      .from("appointments")
      .update({
        starts_at: "2000-01-02T09:00:00Z",
        ends_at: "2000-01-02T09:45:00Z",
        blocked_until: "2000-01-02T09:50:00Z",
      })
      .eq("id", second.data);
    expect(
      (
        await owner.rpc("owner_booking_change", {
          ...args,
          p_id: second.data,
          p_action: "no_show",
        })
      ).error,
    ).toBeNull();
    expect(
      (
        await owner
          .from("appointments")
          .select("status")
          .eq("id", second.data)
          .single()
      ).data!.status,
    ).toBe("no_show");
  });
});
