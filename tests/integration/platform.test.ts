import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const client = () =>
  createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
let admin: SupabaseClient,
  owner: SupabaseClient,
  other: SupabaseClient,
  anonymous: SupabaseClient;
let id: string, inviteId: string, ownerId: string, adminId: string;
const slug = `platform-test-${Date.now()}`;
function sql(query: string) {
  const project = readFileSync("supabase/config.toml", "utf8").match(
    /^project_id = "([a-zA-Z0-9_-]+)"/m,
  )![1];
  return execFileSync(
    "docker",
    [
      "exec",
      "-i",
      `supabase_db_${project}`,
      "psql",
      "-X",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-t",
      "-A",
    ],
    { input: query, encoding: "utf8" },
  );
}
beforeAll(async () => {
  if (!["localhost", "127.0.0.1"].includes(new URL(url).hostname))
    throw new Error("Local tests only");
  [admin, owner, other, anonymous] = [client(), client(), client(), client()];
  const a = await admin.auth.signInWithPassword({
    email: "platform@barbershop-os.example",
    password: "PlatformDemo!2026",
  });
  const o = await owner.auth.signInWithPassword({
    email: "owner@porto-gentlemen.example",
    password: "PortoDemo!2026",
  });
  const b = await other.auth.signInWithPassword({
    email: "owner@atelier-lisboa.example",
    password: "LisboaDemo!2026",
  });
  for (const result of [a, o, b]) expect(result.error).toBeNull();
  ownerId = o.data.user!.id;
  adminId = a.data.user!.id;
});
afterAll(() => {
  if (!id) return;
  sql(`begin;
    delete from public.platform_invitations where tenant_id='${id}';
    delete from public.tenant_memberships where tenant_id='${id}';
    delete from public.tenant_domains where tenant_id='${id}';
    delete from public.business_hours where tenant_id='${id}';
    delete from public.locations where tenant_id='${id}';
    delete from public.tenant_branding where tenant_id='${id}';
    delete from public.feature_entitlements where tenant_id='${id}';
    delete from public.audit_events where tenant_id='${id}';
    alter table public.tenants disable trigger audit_changes;
    delete from public.tenants where id='${id}';
    alter table public.tenants enable trigger audit_changes; commit;`);
});
describe("Platform administration", () => {
  it("denies platform discovery, provisioning and delivery claims to ordinary users", async () => {
    for (const db of [owner, other, anonymous]) {
      expect((await db.rpc("platform_clients")).error).toBeTruthy();
      expect(
        (
          await db.rpc("platform_mutate", {
            p_action: "create",
            p_tenant: null,
            p_payload: {
              name: "Unauthorized",
              slug: "unauthorized",
              email: "test@example.com",
            },
          })
        ).error,
      ).toBeTruthy();
      expect(
        (
          await db.rpc("claim_platform_invitation", {
            p_id: crypto.randomUUID(),
            p_actor: adminId,
          })
        ).error,
      ).toBeTruthy();
    }
    expect((await owner.rpc("is_platform_admin")).data).toBe(false);
    expect((await owner.from("platform_invitations").select("*")).data).toEqual(
      [],
    );
  });
  it("creates a complete isolated workspace and rejects duplicates atomically", async () => {
    const input = {
      p_action: "create",
      p_tenant: null,
      p_payload: {
        name: "Platform test",
        slug,
        email: "owner@porto-gentlemen.example",
        address: "Test address",
        phone: "",
      },
    };
    const created = await admin.rpc("platform_mutate", input);
    expect(created.error).toBeNull();
    id = created.data;
    expect((await admin.rpc("platform_mutate", input)).error?.code).toBe(
      "23505",
    );
    const listed = await admin.rpc("platform_clients", { p_id: id });
    expect(listed.error).toBeNull();
    const c = listed.data.clients[0];
    expect(c).toMatchObject({
      name: "Platform test",
      active: true,
      foundation: true,
      booking: false,
      is_demo: false,
      hours: 0,
      members: [],
    });
    expect(c.invitations).toHaveLength(1);
    inviteId = c.invitations[0].id;
    expect((await owner.from("tenants").select("*").eq("id", id)).data).toEqual(
      [],
    );
    // Platform status access is separate from private customer/catalogue access.
    expect((await admin.from("services").select("*")).data).toEqual([]);
  });
  it("binds invitations to verified email and blocks cancelled and expired invitations", async () => {
    expect(
      (await other.rpc("accept_platform_invitation", { p_id: inviteId })).error,
    ).toBeTruthy();
    sql(
      `update public.platform_invitations set expires_at=now()-interval '1 second' where id='${inviteId}';`,
    );
    expect(
      (await owner.rpc("accept_platform_invitation", { p_id: inviteId })).error,
    ).toBeTruthy();
    sql(
      `update public.platform_invitations set expires_at=now()+interval '7 days',cancelled_at=now() where id='${inviteId}';`,
    );
    expect(
      (await owner.rpc("accept_platform_invitation", { p_id: inviteId })).error,
    ).toBeTruthy();
    sql(
      `update public.platform_invitations set cancelled_at=null where id='${inviteId}';`,
    );
    expect(
      (await owner.rpc("accept_platform_invitation", { p_id: inviteId })).data,
    ).toBe(slug);
    expect(
      (await owner.from("tenants").select("slug").eq("id", id)).data,
    ).toHaveLength(1);
    expect(
      (await owner.rpc("accept_platform_invitation", { p_id: inviteId })).error,
    ).toBeTruthy();
  });
  it("protects the last owner and locks live booking until release readiness", async () => {
    const revoke = await admin.rpc("platform_mutate", {
      p_action: "membership",
      p_tenant: id,
      p_payload: { user_id: ownerId, active: false },
    });
    expect(revoke.error?.message).toContain("last owner");
    const enable = await admin.rpc("platform_mutate", {
      p_action: "update",
      p_tenant: id,
      p_payload: {
        name: "Platform test",
        address: "",
        phone: "",
        active: true,
        foundation: true,
        booking: true,
      },
    });
    expect(enable.error?.message).toContain("release checks");
  });
  it("suspension blocks current sessions at the database and can be restored", async () => {
    for (const active of [false, true]) {
      const saved = await admin.rpc("platform_mutate", {
        p_action: "update",
        p_tenant: id,
        p_payload: {
          name: "Platform test",
          address: "",
          phone: "",
          active,
          foundation: true,
          booking: false,
        },
      });
      expect(saved.error).toBeNull();
      expect(
        (await owner.from("locations").select("id").eq("tenant_id", id)).data,
      ).toHaveLength(active ? 1 : 0);
    }
  });
  it("registers unverified domains and rejects tenant owners changing verification", async () => {
    const added = await admin.rpc("platform_mutate", {
      p_action: "domain_add",
      p_tenant: id,
      p_payload: { hostname: `${slug}.example.com` },
    });
    expect(added.error).toBeNull();
    const c = (await admin.rpc("platform_clients", { p_id: id })).data
      .clients[0];
    expect(c.domains[0].verified_at).toBeNull();
    expect(
      (
        await owner.rpc("platform_mutate", {
          p_action: "domain_verify",
          p_tenant: id,
          p_payload: {
            hostname: `${slug}.example.com`,
            token: c.domains[0].verification_token,
          },
        })
      ).error,
    ).toBeTruthy();
  });
  it("revoking a platform administrator takes effect for their existing session", async () => {
    sql(
      `update private.platform_admins set active=false where user_id='${adminId}';`,
    );
    try {
      expect((await admin.rpc("platform_clients")).error).toBeTruthy();
    } finally {
      sql(
        `update private.platform_admins set active=true where user_id='${adminId}';`,
      );
    }
  });
});
