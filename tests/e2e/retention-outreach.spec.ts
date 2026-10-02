import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { addDays, shopDate } from "../../src/modules/bookings/types";

test("owner records consent and outreach, then attributes a rebooking", async ({
  page,
}) => {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  const tenant = "11111111-1111-4111-8111-111111111111";
  const customer = crypto.randomUUID();
  const name = `Retention browser ${customer.slice(0, 6)}`;
  const appointments: string[] = [];
  const base = `/workspace/porto-gentlemen/customers/${customer}`;
  const atDaysAgo = (days: number) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - days);
    date.setUTCHours(10, 0, 0, 0);
    return date;
  };

  try {
    expect(
      (
        await db.from("customers").insert({
          id: customer,
          tenant_id: tenant,
          display_name: name,
          email: `retention-browser-${customer}@test.example`,
        })
      ).error,
    ).toBeNull();
    for (const daysAgo of [84, 56, 28]) {
      const id = crypto.randomUUID();
      appointments.push(id);
      const start = atDaysAgo(daysAgo);
      expect(
        (
          await db.from("appointments").insert({
            id,
            tenant_id: tenant,
            location_id: "11111111-1111-4111-8111-111111111112",
            customer_id: customer,
            service_id: "10000000-0000-4000-8000-000000000001",
            staff_id: "30000000-0000-4000-8000-000000000001",
            service_name: "Signature cut",
            price_minor: 2800,
            starts_at: start.toISOString(),
            ends_at: new Date(+start + 45 * 60_000).toISOString(),
            blocked_until: new Date(+start + 50 * 60_000).toISOString(),
            status: "completed",
          })
        ).error,
      ).toBeNull();
    }

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
    await expect(page.locator(".retention-health")).toContainText("Due soon");
    const consent = page.locator(".consent-form");
    await consent.getByRole("checkbox").check();
    await consent.getByRole("button", { name: "Record email opt-in" }).click();
    await expect(consent.getByRole("status")).toHaveText(
      "Customer opt-in recorded.",
    );

    await page.goto("/workspace/porto-gentlemen/opportunities/rebooking");
    const card = page.locator(".opportunity-card").filter({ hasText: name });
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: "Record outreach" }).click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("textbox", { name: "Message sent" }),
    ).toHaveValue(/Hi Retention,.*Signature cut/);
    await dialog.getByRole("checkbox").check();
    await dialog.getByRole("button", { name: "Record email outreach" }).click();
    await expect(dialog.getByRole("status")).toHaveText(
      "Outreach recorded for attribution.",
    );
    await dialog.getByRole("button", { name: "Close dialog" }).click();
    await expect(card).toContainText("awaiting outcome");
    await card.getByRole("link", { name: "Book & attribute" }).click();
    await expect(page.locator(".notice.success")).toContainText(
      "will be attributed",
    );

    for (let i = 3; i < 10; i++) {
      await page
        .getByLabel("Date", { exact: true })
        .fill(addDays(shopDate(), i));
      await expect(page.getByText("Finding available times…")).toHaveCount(0);
      if (await page.locator(".time-slot").count()) break;
    }
    await page.locator(".time-slot").first().click();
    await page
      .getByRole("button", { name: "Book next visit", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Next visit booked." }),
    ).toBeVisible();
    await expect(
      page.getByText(/attributed to this appointment/),
    ).toBeVisible();

    const outreach = await db
      .from("customer_outreach_actions")
      .select("attributed_appointment_id")
      .eq("customer_id", customer)
      .single();
    expect(outreach.error).toBeNull();
    expect(outreach.data?.attributed_appointment_id).not.toBeNull();
  } finally {
    await db
      .from("customer_outreach_actions")
      .delete()
      .eq("customer_id", customer);
    await db
      .from("customer_consent_events")
      .delete()
      .eq("customer_id", customer);
    await db.from("appointments").delete().eq("customer_id", customer);
    await db.from("customers").delete().eq("id", customer);
  }
});
