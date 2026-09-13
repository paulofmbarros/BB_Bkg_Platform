import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
const ids: string[] = [];
async function login(page: Page, platform = true) {
  await page.goto("/login");
  await page
    .getByLabel("Email address")
    .fill(
      platform
        ? "platform@barbershop-os.example"
        : "owner@porto-gentlemen.example",
    );
  await page
    .getByLabel("Password", { exact: true })
    .fill(platform ? "PlatformDemo!2026" : "PortoDemo!2026");
  await page.getByRole("button", { name: "Sign in to your workspace" }).click();
  await expect(page).toHaveURL(
    platform ? "/admin" : "/workspace/porto-gentlemen",
  );
}
test.afterAll(() => {
  if (!ids.length) return;
  const project = readFileSync("supabase/config.toml", "utf8").match(
    /^project_id = "([a-zA-Z0-9_-]+)"/m,
  )![1];
  const list = ids.map((id) => `'${id}'`).join(",");
  execFileSync(
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
    ],
    {
      input: `begin;
    delete from public.platform_invitations where tenant_id in (${list});
    delete from public.tenant_memberships where tenant_id in (${list});
    delete from public.tenant_domains where tenant_id in (${list});
    delete from public.business_hours where tenant_id in (${list});
    delete from public.locations where tenant_id in (${list});
    delete from public.tenant_branding where tenant_id in (${list});
    delete from public.feature_entitlements where tenant_id in (${list});
    delete from public.audit_events where tenant_id in (${list});
    alter table public.tenants disable trigger audit_changes;
    delete from public.tenants where id in (${list});
    alter table public.tenants enable trigger audit_changes; commit;`,
      stdio: ["pipe", "ignore", "pipe"],
    },
  );
});
test("platform administration is private and unavailable on shop domains", async ({
  page,
  request,
}) => {
  await page.goto("/admin");
  await expect(page).toHaveURL("/login");
  await login(page, false);
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "This page isn’t available." }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Add barbershop" })).toHaveCount(
    0,
  );
  const tenantResponse = await request.get(
    "http://porto-gentlemen.localhost:3000/admin",
  );
  expect(tenantResponse.status()).toBe(404);
});
test("operator creates, finds and manages a barbershop on desktop and mobile", async ({
  page,
}, testInfo) => {
  await login(page);
  await expect(page.getByRole("heading", { name: "Clients." })).toBeVisible();
  await page.getByRole("link", { name: "Add barbershop" }).click();
  const slug = `browser-platform-${Date.now()}`;
  await page.getByLabel("Barbershop name").fill("Downtown Barbers Test");
  await page.getByLabel("Address", { exact: true }).fill("14 Example Street");
  await page.getByLabel("Shop identifier").fill(slug);
  await page.getByLabel("Owner email").fill("owner@porto-gentlemen.example");
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page).toHaveURL(/\/admin\/clients\/[0-9a-f-]{36}$/);
  const id = page.url().split("/").pop()!;
  ids.push(id);
  await expect(
    page.getByRole("heading", { name: "Downtown Barbers Test", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Copy owner workspace link" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open customer booking page" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Copy owner workspace link" }).click();
  await expect(
    page.getByRole("button", { name: "Workspace link copied" }),
  ).toBeVisible();
  await expect(page.getByText("Not sent", { exact: true })).toBeVisible();
  await expect(
    page.getByLabel("Booking enabled", { exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Workspace access enabled").uncheck();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Changes saved" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Workspace access enabled")).not.toBeChecked();
  await page.getByLabel("Workspace access enabled").check();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Changes saved" }),
  ).toBeVisible();
  await page.getByLabel("Hostname").fill(`${slug}.example.com`);
  await page.getByRole("button", { name: "Add booking address" }).click();
  await expect(
    page.getByText("Awaiting verification", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open customer booking page" }),
  ).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath("client-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("client-mobile.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Cancel invitation" }).click();
  await expect(page.getByText("Cancelled", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "All clients" }).click();
  await page.getByLabel("Search clients").fill(slug);
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.locator(".platform-client-row")).toHaveCount(1);
});
test("verified clients link to their customer booking page", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/clients/11111111-1111-4111-8111-111111111111");
  const link = page.getByRole("link", { name: "Open customer booking page" });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute(
    "href",
    "http://porto-gentlemen.localhost:3000/book",
  );
  await expect(link).toHaveAttribute("target", "_blank");
});
test("operator can troubleshoot a client in support mode", async ({ page }) => {
  const tenantId = "11111111-1111-4111-8111-111111111111";
  const supportDay = "2035-06-18";
  const supportCustomerId = randomUUID();
  const supportAppointmentId = randomUUID();
  const supportService = `Support check ${Date.now()}`;
  const serviceDb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const [{ data: location }, { data: service }, { data: staff }] =
    await Promise.all([
      serviceDb
        .from("locations")
        .select("id")
        .eq("tenant_id", tenantId)
        .single(),
      serviceDb
        .from("services")
        .select("id,name,price_minor")
        .eq("tenant_id", tenantId)
        .limit(1)
        .single(),
      serviceDb
        .from("staff_members")
        .select("id")
        .eq("tenant_id", tenantId)
        .limit(1)
        .single(),
    ]);
  expect(location).toBeTruthy();
  expect(service).toBeTruthy();
  expect(staff).toBeTruthy();
  expect(
    (
      await serviceDb.from("customers").insert({
        id: supportCustomerId,
        tenant_id: tenantId,
        display_name: "Support Redaction Fixture",
        email: `support-${supportCustomerId}@example.com`,
      })
    ).error,
  ).toBeNull();
  expect(
    (
      await serviceDb.from("appointments").insert({
        id: supportAppointmentId,
        tenant_id: tenantId,
        location_id: location!.id,
        customer_id: supportCustomerId,
        service_id: service!.id,
        staff_id: staff!.id,
        service_name: service!.name,
        price_minor: service!.price_minor,
        starts_at: `${supportDay}T10:00:00Z`,
        ends_at: `${supportDay}T10:30:00Z`,
        blocked_until: `${supportDay}T10:35:00Z`,
      })
    ).error,
  ).toBeNull();
  await login(page);
  try {
    await page.goto(`/admin/clients/${tenantId}`);
    await page.getByRole("link", { name: "Open support workspace" }).click();
    await expect(page).toHaveURL("/workspace/porto-gentlemen");
    await expect(
      page.getByText("Platform support mode", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Find setup problems quickly" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Customers", exact: true }),
    ).toHaveCount(0);
    await page.getByRole("link", { name: "Services", exact: true }).click();
    await page
      .getByRole("button", { name: "Add service", exact: true })
      .click();
    const dialog = page.getByRole("dialog", { name: "Add a service" });
    await dialog.getByLabel("Service name").fill(supportService);
    await dialog.getByLabel("Price (€)").fill("15");
    await dialog
      .getByRole("button", { name: "Add service", exact: true })
      .click();
    await expect(dialog.getByRole("status")).toContainText("Service added");
    await page.reload();
    await expect(
      page.getByRole("heading", { name: supportService }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Calendar", exact: true }),
    ).toBeVisible();
    await page.goto(`/workspace/porto-gentlemen/calendar?day=${supportDay}`);
    await expect(
      page.getByText("Customer details hidden").first(),
    ).toBeVisible();
    await expect(page.locator(".appointment-controls")).toHaveCount(0);
    await page.goto("/workspace/porto-gentlemen/customers");
    await expect(
      page.getByRole("heading", { name: "This page isn’t available." }),
    ).toBeVisible();
  } finally {
    await serviceDb
      .from("appointments")
      .delete()
      .eq("id", supportAppointmentId);
    await serviceDb.from("customers").delete().eq("id", supportCustomerId);
    await serviceDb
      .from("services")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("name", supportService);
  }
});
for (const existingAccount of [false, true]) {
  test(`emailed invitation finishes setup for ${existingAccount ? "an existing" : "a new"} account`, async ({
    page,
    request,
  }) => {
    // Only local Auth and Mailpit are used. No real messages are sent.
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const operator = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    await operator.auth.signInWithPassword({
      email: "platform@barbershop-os.example",
      password: "PlatformDemo!2026",
    });
    const suffix = Date.now();
    const email = `invited-${suffix}@example.com`;
    const slug = `invited-shop-${suffix}`;
    const created = await operator.rpc("platform_mutate", {
      p_action: "create",
      p_tenant: null,
      p_payload: { name: "Invited shop", slug, email, address: "", phone: "" },
    });
    expect(created.error).toBeNull();
    ids.push(created.data);
    const details = await operator.rpc("platform_clients", {
      p_id: created.data,
    });
    const inviteId = details.data.clients[0].invitations[0].id;
    if (existingAccount) {
      const account = await db.auth.admin.createUser({
        email,
        password: "ExistingOwner!2026",
        email_confirm: true,
      });
      expect(account.error).toBeNull();
    }
    try {
      const sent = await operator.functions.invoke("platform-invite", {
        body: { invitation_id: inviteId },
      });
      expect(sent.error).toBeNull();
      expect(sent.data?.ok).toBe(true);
      const repeated = await operator.functions.invoke("platform-invite", {
        body: { invitation_id: inviteId },
      });
      expect(repeated.error).toBeTruthy();
      const ordinary = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      );
      await ordinary.auth.signInWithPassword({
        email: "owner@porto-gentlemen.example",
        password: "PortoDemo!2026",
      });
      expect(
        (
          await ordinary.functions.invoke("platform-invite", {
            body: { invitation_id: inviteId },
          })
        ).error,
      ).toBeTruthy();
      let messageId: string | undefined;
      await expect
        .poll(async () => {
          const messages = await (
            await request.get("http://127.0.0.1:54324/api/v1/messages")
          ).json();
          messageId = messages.messages.find(
            (message: { ID: string; To: { Address: string }[] }) =>
              message.To.some((to) => to.Address === email),
          )?.ID;
          return !!messageId;
        })
        .toBe(true);
      const message = await (
        await request.get(`http://127.0.0.1:54324/api/v1/message/${messageId}`)
      ).json();
      const link = message.HTML.match(
        /href="(http[^"]+\/auth\/v1\/verify[^"]+)"/,
      )?.[1]?.replaceAll("&amp;", "&");
      expect(link).toBeTruthy();
      await page.goto(link);
      await expect(
        page.getByRole("heading", { name: "Your workspace is waiting." }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Accept invitation" }).click();
      await expect(page).toHaveURL("/reset-password?invited=1");
      await page
        .getByLabel("New password", { exact: true })
        .fill("InvitedOwner!2026");
      await page.getByLabel("Confirm password").fill("InvitedOwner!2026");
      await page.getByRole("button", { name: "Set new password" }).click();
      await expect(page).toHaveURL("/login?reset=success");
      await page.getByLabel("Email address").fill(email);
      await page
        .getByLabel("Password", { exact: true })
        .fill("InvitedOwner!2026");
      await page
        .getByRole("button", { name: "Sign in to your workspace" })
        .click();
      await expect(page).toHaveURL(`/workspace/${slug}`);
    } finally {
      const users = await db.auth.admin.listUsers({ perPage: 1000 });
      const user = users.data.users.find((u) => u.email === email);
      if (user) await db.auth.admin.deleteUser(user.id);
    }
  });
}
