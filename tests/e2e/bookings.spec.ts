import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import AxeBuilder from "@axe-core/playwright";
import { addDays, shopDate } from "../../src/modules/bookings/types";
const origin = "http://porto-gentlemen.localhost:3000";
const A = "11111111-1111-4111-8111-111111111111";
function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
test("guest books on mobile, owner reschedules, guest cancels, and links stay private", async ({
  page,
}) => {
  const email = `browser-booking-${Date.now()}@test.example`,
    name = "Synthetic browser guest";
  const db = admin();
  let id = "",
    customer = "";
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(
      `${origin}/book?service=10000000-0000-4000-8000-000000000001`,
    );
    await expect(
      page.getByRole("heading", { name: "Book your next visit." }),
    ).toBeVisible();
    let day = "";
    for (let i = 2; i < 9; i++) {
      day = addDays(shopDate(), i);
      await page.getByLabel("Date", { exact: true }).fill(day);
      await expect(page.getByText("Finding available times…")).toHaveCount(0);
      if (await page.locator(".time-slot").count()) break;
    }
    await expect(page.locator(".time-slot").first()).toBeVisible();
    await page.locator(".time-slot").first().click();
    await page.getByLabel("Your name").fill(name);
    await page.getByLabel("Email address").fill(email);
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
      path: "test-results/booking-mobile.png",
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Confirm appointment", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Your time is reserved." }),
    ).toBeVisible();
    const privateUrl = page.url();
    expect(privateUrl).toMatch(/\/manage#[a-f0-9]{64}$/);
    const token = privateUrl.split("#")[1];
    const guest = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false } },
    );
    const result = await guest.rpc("manage_booking", {
      p_host: "porto-gentlemen.localhost",
      p_token: token,
    });
    expect(result.error).toBeNull();
    id = result.data.id;
    const row = await db
      .from("appointments")
      .select("customer_id")
      .eq("id", id)
      .single();
    customer = row.data!.customer_id;
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Your time is reserved." }),
    ).toBeVisible();
    await page.goto("http://127.0.0.1:3000/login");
    await page
      .getByLabel("Email address")
      .fill("owner@porto-gentlemen.example");
    await page.getByLabel("Password", { exact: true }).fill("PortoDemo!2026");
    await page
      .getByRole("button", { name: "Sign in to your workspace" })
      .click();
    await expect(page).toHaveURL(
      "http://127.0.0.1:3000/workspace/porto-gentlemen",
    );
    await page.goto(
      `http://127.0.0.1:3000/workspace/porto-gentlemen/calendar?day=${day}`,
    );
    const card = page.locator(".appointment-card").filter({ hasText: name });
    await expect(card).toBeVisible();
    await page.setViewportSize({ width: 1440, height: 1000 });
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await page.screenshot({
      path: "test-results/calendar-desktop.png",
      fullPage: true,
    });
    await card.getByRole("button", { name: "Reschedule", exact: true }).click();
    await card.getByLabel("Date", { exact: true }).fill(day);
    await expect(card.locator(".time-slot").first()).toBeVisible();
    await card.locator(".time-slot").first().click();
    await card.getByRole("button", { name: "Save new time" }).click();
    await expect(card.getByRole("status")).toHaveText("Appointment updated.");
    const moved = await db
      .from("appointments")
      .select("version,starts_at")
      .eq("id", id)
      .single();
    expect(moved.data!.version).toBe(2);
    await page.goto(privateUrl);
    await expect(
      page.getByRole("heading", { name: "Your time is reserved." }),
    ).toBeVisible();
    page.once("dialog", (d) => d.accept());
    await page
      .getByRole("button", { name: "Cancel appointment", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Your appointment is cancelled." }),
    ).toBeVisible();
    expect(
      (await db.from("appointments").select("status").eq("id", id).single())
        .data!.status,
    ).toBe("cancelled");
    await page.goto(privateUrl.replace("porto-gentlemen", "atelier-lisboa"));
    await expect(
      page.getByRole("alert").filter({ hasText: "Booking not found" }),
    ).toBeVisible();
  } finally {
    if (!customer) {
      const found = await db
        .from("customers")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      customer = found.data?.id ?? "";
    }
    if (customer)
      await db.from("appointments").delete().eq("customer_id", customer);
    else if (id) await db.from("appointments").delete().eq("id", id);
    if (customer) await db.from("customers").delete().eq("id", customer);
  }
});
test("public API rejects foreign origins, unknown domains, and private workspace access", async ({
  request,
}) => {
  const forged = await request.post(`${origin}/api/booking`, {
    headers: { origin: "https://attacker.example" },
    data: { action: "view", token: "a".repeat(64) },
  });
  expect(forged.status()).toBe(403);
  const workspace = await request.get(
    `${origin}/workspace/porto-gentlemen/calendar`,
  );
  expect(workspace.status()).toBe(404);
  const unknown = await request.get("http://unknown.localhost:3000/book");
  expect(await unknown.text()).toContain("This page isn’t available.");
  const privateRows = await admin()
    .from("appointments")
    .select("id")
    .eq("tenant_id", A);
  expect(privateRows.error).toBeNull();
});
