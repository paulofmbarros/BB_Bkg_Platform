import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
const tenant = "11111111-1111-4111-8111-111111111111";
const admin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
test("owner logo upload validates the image and updates the preview", async ({
  page,
}) => {
  const db = admin();
  const before = await db
    .from("tenant_branding")
    .select("logo_path")
    .eq("tenant_id", tenant)
    .single();
  await page.goto("/login");
  await page.getByLabel("Email address").fill("owner@porto-gentlemen.example");
  await page.getByLabel("Password", { exact: true }).fill("PortoDemo!2026");
  await page.getByRole("button", { name: "Sign in to your workspace" }).click();
  await expect(page).toHaveURL("/workspace/porto-gentlemen");
  await page.getByRole("link", { name: "Brand & business" }).click();
  try {
    await page.getByLabel("Shop logo").setInputFiles({
      name: "test.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
    });
    await page.getByRole("button", { name: "Upload logo" }).click();
    await expect(page.locator(".notice.failure")).toContainText(
      "not a supported image",
    );
    await page.getByLabel("Shop logo").setInputFiles({
      name: "test.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6QmcAAAAASUVORK5CYII=",
        "base64",
      ),
    });
    await page.getByRole("button", { name: "Upload logo" }).click();
    await expect(page.getByRole("status")).toContainText("Logo updated");
    const image = page.getByRole("img", { name: "Porto Gentlemen logo" });
    await expect(image).toBeVisible();
    await expect
      .poll(async () =>
        image.evaluate((el: HTMLImageElement) => el.naturalWidth),
      )
      .toBeGreaterThan(0);
  } finally {
    const after = await db
      .from("tenant_branding")
      .select("logo_path")
      .eq("tenant_id", tenant)
      .single();
    await db
      .from("tenant_branding")
      .update({ logo_path: before.data?.logo_path ?? null })
      .eq("tenant_id", tenant);
    if (
      after.data?.logo_path &&
      after.data.logo_path !== before.data?.logo_path
    )
      await db.storage.from("brand-assets").remove([after.data.logo_path]);
  }
});
test("password recovery works through the locally captured email", async ({
  page,
  request,
}) => {
  const db = admin();
  const { data } = await db.auth.admin.listUsers();
  const user = data.users.find(
    (u) => u.email === "owner@porto-gentlemen.example",
  )!;
  const inboxBefore = await (
    await request.get("http://127.0.0.1:54324/api/v1/messages")
  ).json();
  const oldIds = new Set(inboxBefore.messages.map((m: { ID: string }) => m.ID));
  await page.goto("/forgot-password");
  await page.getByLabel("Email address").fill(user.email!);
  await page.getByRole("button", { name: "Send recovery link" }).click();
  await expect(page.getByRole("status")).toContainText(
    "recovery link will arrive",
  );
  let id = "";
  await expect
    .poll(async () => {
      const messages = await (
        await request.get("http://127.0.0.1:54324/api/v1/messages")
      ).json();
      const message = messages.messages.find(
        (m: { ID: string; To: { Address: string }[]; Subject: string }) =>
          !oldIds.has(m.ID) &&
          m.To.some((t) => t.Address === user.email) &&
          /reset/i.test(m.Subject),
      );
      id = message?.ID ?? "";
      return Boolean(id);
    })
    .toBe(true);
  const mail = await (
    await request.get(`http://127.0.0.1:54324/api/v1/message/${id}`)
  ).json();
  const link = (mail.Text ?? mail.HTML)
    .match(/https?:\/\/[^\s"<>]*\/auth\/v1\/verify[^\s"<>]*/)?.[0]
    ?.replaceAll("&amp;", "&");
  expect(link).toBeTruthy();
  try {
    await page.goto(link!);
    await expect(page).toHaveURL("/reset-password");
    await page.getByLabel("New password").fill("TemporaryDemo!2026");
    await page.getByLabel("Confirm password").fill("TemporaryDemo!2026");
    await page.getByRole("button", { name: "Set new password" }).click();
    await expect(page).toHaveURL("/login?reset=success");
    await page.getByLabel("Email address").fill(user.email!);
    await page
      .getByLabel("Password", { exact: true })
      .fill("TemporaryDemo!2026");
    await page
      .getByRole("button", { name: "Sign in to your workspace" })
      .click();
    await expect(page).toHaveURL("/workspace/porto-gentlemen");
  } finally {
    await db.auth.admin.updateUserById(user.id, { password: "PortoDemo!2026" });
  }
});
