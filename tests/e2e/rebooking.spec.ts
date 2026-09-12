import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import AxeBuilder from "@axe-core/playwright";
import { addDays, shopDate } from "../../src/modules/bookings/types";
test("owner books from a customer profile into the same history", async ({
  page,
}) => {
  const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    ),
    id = crypto.randomUUID(),
    base = `/workspace/porto-gentlemen/customers/${id}`;
  const historicalId = crypto.randomUUID(),
    tenant = "11111111-1111-4111-8111-111111111111";
  const ids = new Set([historicalId]);
  try {
    expect(
      (
        await db.from("customers").insert({
          id,
          tenant_id: tenant,
          display_name: "Browser repeat customer",
          email: `rebook-browser-${id}@test.example`,
        })
      ).error,
    ).toBeNull();
    expect(
      (
        await db.from("appointments").insert({
          id: historicalId,
          tenant_id: tenant,
          location_id: "11111111-1111-4111-8111-111111111112",
          customer_id: id,
          service_id: "10000000-0000-4000-8000-000000000001",
          staff_id: "30000000-0000-4000-8000-000000000001",
          service_name: "Signature cut",
          price_minor: 2800,
          starts_at: "1993-01-01T09:00:00Z",
          ends_at: "1993-01-01T09:45:00Z",
          blocked_until: "1993-01-01T09:50:00Z",
          status: "completed",
        })
      ).error,
    ).toBeNull();
    await page.goto("/login");
    await page
      .getByLabel("Email address")
      .fill("owner@porto-gentlemen.example");
    await page.getByLabel("Password", { exact: true }).fill("PortoDemo!2026");
    await page
      .getByRole("button", { name: "Sign in to your workspace" })
      .click();
    await expect(page).toHaveURL("/workspace/porto-gentlemen");
    await page.goto(base);
    await page
      .getByRole("link", { name: "Book next visit", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Book the next visit." }),
    ).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: "Service", exact: true }),
    ).toHaveValue("10000000-0000-4000-8000-000000000001");
    let day = "";
    for (let i = 3; i < 10; i++) {
      day = addDays(shopDate(), i);
      await page.getByLabel("Date", { exact: true }).fill(day);
      await expect(page.getByText("Finding available times…")).toHaveCount(0);
      if (await page.locator(".time-slot").count()) break;
    }
    await page.locator(".time-slot").first().click();
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
      path: "test-results/profile-rebooking.png",
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Book next visit", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Next visit booked." }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "Back to customer profile", exact: true })
      .last()
      .click();
    await page.getByRole("link", { name: "Upcoming", exact: true }).click();
    await expect(page.locator(".customer-history-row").first()).toBeVisible();
    const after = await db
      .from("appointments")
      .select("id,status")
      .eq("customer_id", id);
    expect(after.data!.filter((a) => !ids.has(a.id))).toHaveLength(1);
  } finally {
    await db.from("appointments").delete().eq("customer_id", id);
    await db.from("customers").delete().eq("id", id);
  }
});
