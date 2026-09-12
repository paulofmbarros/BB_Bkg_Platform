import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createClient } from "@supabase/supabase-js";
const base = "/workspace/porto-gentlemen/customers",
  id = "60000000-0000-4000-8000-000000000001";
async function login(page: Page, staff = false) {
  await page.goto("/login");
  await page
    .getByLabel("Email address")
    .fill(`${staff ? "staff" : "owner"}@porto-gentlemen.example`);
  await page
    .getByLabel("Password", { exact: true })
    .fill(staff ? "StaffDemo!2026" : "PortoDemo!2026");
  await page.getByRole("button", { name: "Sign in to your workspace" }).click();
  await expect(page).toHaveURL("/workspace/porto-gentlemen");
}
test("customer directory, visit filters and contact edits work on mobile", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("link", { name: "Customers", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Familiar faces. New stories." }),
  ).toBeVisible();
  await page.getByLabel("Find a customer").fill("calendar-demo-1@");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.locator(".customer-row")).toHaveCount(1);
  await page.locator(".customer-row").click();
  await expect(page).toHaveURL(new RegExp(id));
  await expect(
    page.getByRole("heading", { name: "Visit history", exact: true }),
  ).toBeVisible();
  expect(await page.locator(".customer-history-row").count()).toBeGreaterThan(
    1,
  );
  await page.getByRole("link", { name: "Cancelled", exact: true }).click();
  await expect(page.getByText("No appointments in this view.")).toBeVisible();
  await page.getByRole("link", { name: "Completed", exact: true }).click();
  await expect(page.locator(".customer-history-row").first()).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "test-results/customer-profile-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({
    path: "test-results/customer-profile-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Edit details", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const original = await dialog
    .getByLabel("Name", { exact: true })
    .inputValue();
  try {
    await dialog
      .getByLabel("Name", { exact: true })
      .fill("Miguel Santos · updated");
    await dialog.getByRole("button", { name: "Save customer details" }).click();
    await expect(dialog.getByRole("status")).toHaveText(
      "Customer details saved.",
    );
    await dialog.getByRole("button", { name: "Close dialog" }).click();
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Miguel Santos · updated",
    );
  } finally {
    await page
      .getByRole("button", { name: "Edit details", exact: true })
      .click();
    await dialog.getByLabel("Name", { exact: true }).fill(original);
    await dialog.getByRole("button", { name: "Save customer details" }).click();
    await expect(dialog.getByRole("status")).toHaveText(
      "Customer details saved.",
    );
    await dialog.getByRole("button", { name: "Close dialog" }).click();
  }
  await page.getByRole("link", { name: "View in calendar" }).first().click();
  await expect(
    page.locator(".appointment-card").filter({ hasText: original }),
  ).toBeVisible();
  await page.getByRole("link", { name: original, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(id));
});
test("staff customer profiles remain read-only and exclude unrelated customers", async ({
  page,
}) => {
  await login(page, true);
  await page.goto(`${base}/${id}`);
  await expect(
    page.getByRole("heading", { name: "This page isn’t available." }),
  ).toBeVisible();
  await page.goto(`${base}/60000000-0000-4000-8000-000000000002`);
  await expect(
    page.getByRole("heading", { name: "Visit history", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit details" })).toHaveCount(
    0,
  );
  await expect(
    page.getByText("This profile shows only", { exact: false }),
  ).toBeVisible();
  await page.goto("/workspace/atelier-lisboa/customers");
  await expect(
    page.getByRole("heading", { name: "This page isn’t available." }),
  ).toBeVisible();
});
test("directory pagination and literal searches preserve complete results", async ({
  page,
}) => {
  const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    ),
    prefix = `Pagination ${Date.now()}`;
  const rows = Array.from({ length: 22 }, (_, i) => ({
    id: crypto.randomUUID(),
    tenant_id: "11111111-1111-4111-8111-111111111111",
    display_name: `${prefix} ${String(i).padStart(2, "0")}`,
    email: `pagination-${i}@test.example`,
  }));
  const inserted = await db.from("customers").insert(rows);
  expect(inserted.error).toBeNull();
  try {
    await login(page);
    await page.goto(`${base}?q=${encodeURIComponent(prefix)}`);
    await expect(page.locator(".customer-row")).toHaveCount(20);
    await page.getByRole("link", { name: "Next", exact: true }).click();
    await expect(page.locator(".customer-row")).toHaveCount(2);
    await page.getByRole("link", { name: "Previous", exact: true }).click();
    await expect(page.locator(".customer-row")).toHaveCount(20);
    await page.getByLabel("Find a customer").fill("%");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page.locator(".customer-row")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "No matching customers." }),
    ).toBeVisible();
  } finally {
    await db
      .from("customers")
      .delete()
      .in(
        "id",
        rows.map((r) => r.id),
      );
  }
});
