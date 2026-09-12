import { beforeAll, describe, it, expect } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { defaultHours } from "../../src/modules/scheduling/hours";
const A = "11111111-1111-4111-8111-111111111111",
  B = "22222222-2222-4222-8222-222222222222";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const client = () =>
  createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
let owner: SupabaseClient,
  staff: SupabaseClient,
  manager: SupabaseClient,
  other: SupabaseClient;
beforeAll(async () => {
  if (!["127.0.0.1", "localhost"].includes(new URL(url).hostname))
    throw new Error("Integration tests are local-only.");
  [owner, staff, manager, other] = [client(), client(), client(), client()];
  const results = await Promise.all([
    owner.auth.signInWithPassword({
      email: "owner@porto-gentlemen.example",
      password: "PortoDemo!2026",
    }),
    staff.auth.signInWithPassword({
      email: "staff@porto-gentlemen.example",
      password: "StaffDemo!2026",
    }),
    manager.auth.signInWithPassword({
      email: "manager@porto-gentlemen.example",
      password: "ManagerDemo!2026",
    }),
    other.auth.signInWithPassword({
      email: "owner@atelier-lisboa.example",
      password: "LisboaDemo!2026",
    }),
  ]);
  results.forEach((result) => expect(result.error).toBeNull());
});
describe("Database-enforced tenant boundaries", () => {
  it("creates a staff profile with its services and starting hours in one transaction", async () => {
    const created = await owner.rpc("save_staff", {
      p_tenant: A,
      p_id: null,
      p_name: "Integration barber",
      p_title: "Barber",
      p_bio: "Synthetic test profile",
      p_active: true,
      p_services: ["10000000-0000-4000-8000-000000000001"],
    });
    expect(created.error).toBeNull();
    try {
      const hours = await owner
        .from("staff_working_hours")
        .select("weekday")
        .eq("staff_id", created.data);
      expect(hours.data).toHaveLength(7);
      const assignments = await owner
        .from("staff_services")
        .select("service_id")
        .eq("staff_id", created.data);
      expect(assignments.data).toHaveLength(1);
    } finally {
      await owner.from("staff_members").delete().eq("id", created.data);
    }
  });
  it("does not reveal any other tenant business rows", async () => {
    for (const table of [
      "services",
      "staff_members",
      "staff_services",
      "business_hours",
      "staff_working_hours",
      "tenant_branding",
      "locations",
      "tenant_domains",
      "feature_entitlements",
      "availability_exceptions",
      "audit_events",
    ]) {
      const { data, error } = await owner
        .from(table)
        .select("*")
        .eq("tenant_id", B);
      expect(error, table).toBeNull();
      expect(data, table).toEqual([]);
    }
    const { data } = await other.from("services").select("tenant_id");
    expect(data?.every((row) => row.tenant_id === B)).toBe(true);
  });
  it("cannot change another tenant, grant membership, change plan or move ownership", async () => {
    const update = await owner
      .from("services")
      .update({ name: "Unauthorized" })
      .eq("tenant_id", B)
      .select();
    expect(update.data).toEqual([]);
    const move = await owner
      .from("services")
      .update({ tenant_id: B })
      .eq("tenant_id", A);
    expect(move.error).not.toBeNull();
    const role = await owner
      .from("tenant_memberships")
      .update({ role: "owner" })
      .eq("tenant_id", B);
    expect(role.error).not.toBeNull();
    const plan = await owner
      .from("feature_entitlements")
      .update({ enabled: false })
      .eq("tenant_id", A);
    expect(plan.error).not.toBeNull();
    const active = await owner
      .from("tenants")
      .update({ active: false })
      .eq("id", A);
    expect(active.error).not.toBeNull();
  });
  it("cannot attach a service from another tenant to local staff", async () => {
    const { error } = await owner.from("staff_services").insert({
      tenant_id: A,
      staff_id: "30000000-0000-4000-8000-000000000001",
      service_id: "20000000-0000-4000-8000-000000000001",
    });
    expect(error?.code).toBe("23503");
  });
  it("prevents staff writes and manager branding changes", async () => {
    const s = await staff
      .from("services")
      .update({ name: "Unauthorized" })
      .eq("tenant_id", A)
      .select();
    expect(s.data).toEqual([]);
    const m = await manager.rpc("save_branding", {
      p_tenant: A,
      p_name: "Changed",
      p_tagline: "Changed",
      p_description: "",
      p_accent: "#000000",
      p_address: "Changed",
      p_phone: "",
    });
    expect(m.error?.code).toBe("42501");
    const audit = await staff.from("audit_events").select("*");
    expect(audit.data).toEqual([]);
  });
  it("makes schedule changes atomic and rejects cross-tenant subjects", async () => {
    const location = "11111111-1111-4111-8111-111111111112";
    const before = await owner
      .from("business_hours")
      .select("*")
      .eq("tenant_id", A)
      .order("weekday");
    const bad = defaultHours();
    bad[2].end_time = "08:00";
    const failed = await owner.rpc("save_hours", {
      p_tenant: A,
      p_subject: location,
      p_staff: false,
      p_rows: bad,
    });
    expect(failed.error).not.toBeNull();
    const after = await owner
      .from("business_hours")
      .select("*")
      .eq("tenant_id", A)
      .order("weekday");
    expect(after.data).toEqual(before.data);
    const cross = await owner.rpc("save_hours", {
      p_tenant: A,
      p_subject: "22222222-2222-4222-8222-222222222223",
      p_staff: false,
      p_rows: defaultHours(),
    });
    expect(cross.error).not.toBeNull();
  });
  it("rolls back a staff creation with invalid cross-tenant assignments", async () => {
    const result = await owner.rpc("save_staff", {
      p_tenant: A,
      p_id: null,
      p_name: "Rollback test",
      p_title: "Barber",
      p_bio: "",
      p_active: true,
      p_services: ["20000000-0000-4000-8000-000000000001"],
    });
    expect(result.error?.code).toBe("23503");
    const after = await owner
      .from("staff_members")
      .select("id")
      .eq("tenant_id", A)
      .eq("display_name", "Rollback test");
    expect(after.data).toEqual([]);
  });
  it("exposes only the verified public catalogue to guests", async () => {
    const anon = client();
    const internal = await anon.from("services").select("*");
    expect(internal.error).not.toBeNull();
    const { data, error } = await anon.rpc("get_public_shop", {
      p_hostname: "porto-gentlemen.localhost",
    });
    expect(error).toBeNull();
    expect(data.name).toBe("Porto Gentlemen");
    expect(data.staff[0]).not.toHaveProperty("user_id");
    expect(data).not.toHaveProperty("tenant_id");
    expect(data).not.toHaveProperty("entitlements");
    const unknown = await anon.rpc("get_public_shop", {
      p_hostname: "unverified.example",
    });
    expect(unknown.data).toBeNull();
  });
  it("rejects cross-tenant asset uploads", async () => {
    const { error } = await owner.storage
      .from("brand-assets")
      .upload(`${B}/forbidden.png`, new Uint8Array([137, 80, 78, 71]), {
        contentType: "image/png",
      });
    expect(error).not.toBeNull();
  });
  it("applies entitlement and membership revocations to existing sessions", async () => {
    const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
    } = await owner.auth.getUser();
    try {
      await admin
        .from("feature_entitlements")
        .update({ enabled: false })
        .eq("tenant_id", A)
        .eq("feature", "foundation");
      const write = await owner
        .from("services")
        .update({ name: "Forbidden by plan" })
        .eq("tenant_id", A)
        .select();
      expect(write.data).toEqual([]);
      await admin
        .from("tenant_memberships")
        .update({ active: false })
        .eq("tenant_id", A)
        .eq("user_id", user!.id);
      const read = await owner.from("services").select("id").eq("tenant_id", A);
      expect(read.data).toEqual([]);
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
  it("persists legitimate service edits and records an audit event", async () => {
    const created = await owner
      .from("services")
      .insert({
        tenant_id: A,
        name: "Integration service",
        category: "Hair",
        duration_minutes: 30,
        price_minor: 1999,
      })
      .select()
      .single();
    expect(created.error).toBeNull();
    const id = created.data.id;
    try {
      const edit = await manager
        .from("services")
        .update({ price_minor: 2199 })
        .eq("id", id)
        .select()
        .single();
      expect(edit.error).toBeNull();
      expect(edit.data.price_minor).toBe(2199);
      const audit = await owner
        .from("audit_events")
        .select("operation")
        .eq("entity_id", id);
      expect(audit.data?.map((x) => x.operation)).toContain("UPDATE");
    } finally {
      await owner.from("services").delete().eq("id", id);
    }
  });
});
