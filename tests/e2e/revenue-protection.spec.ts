import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { addDays, shopDate } from "../../src/modules/bookings/types";

const tenant = "11111111-1111-4111-8111-111111111111";
const shopOrigin = "http://porto-gentlemen.localhost:3000";

test("owner applies a deposit policy and resolves an eligible refund", async ({
  page,
}) => {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const original = await admin
    .from("revenue_protection_policies")
    .select("*")
    .eq("tenant_id", tenant)
    .single();
  expect(original.error).toBeNull();
  const email = `browser-protection-${Date.now()}@test.example`;
  const name = "Synthetic protected guest";
  let appointment = "";
  let customer = "";

  try {
    await page.goto("/login");
    await page
      .getByLabel("Email address")
      .fill("owner@porto-gentlemen.example");
    await page.getByLabel("Password", { exact: true }).fill("PortoDemo!2026");
    await page
      .getByRole("button", { name: "Sign in to your workspace" })
      .click();
    await page.getByRole("link", { name: "Revenue protection" }).click();
    await expect(
      page.getByRole("heading", { name: "Protect the appointment, fairly." }),
    ).toBeVisible();

    await page.getByLabel("Revenue protection enabled").check();
    await page.getByLabel("Deposit rule").selectOption("all");
    await page.getByLabel("Deposit percentage").fill("25");
    await page.getByLabel("Refund deadline (hours before)").fill("24");
    await page.getByLabel("Reminder lead time (hours)").fill("24");
    await page.getByRole("button", { name: "Save protection policy" }).click();
    await expect(page.getByRole("status")).toHaveText(
      "Revenue protection policy saved.",
    );

    await page.goto(`${shopOrigin}/book`);
    let day = "";
    for (let i = 2; i < 9; i++) {
      day = addDays(shopDate(), i);
      await page.getByLabel("Date", { exact: true }).fill(day);
      await expect(page.getByText("Finding available times…")).toHaveCount(0);
      if (await page.locator(".time-slot").count()) break;
    }
    await page.locator(".time-slot").first().click();
    await page.getByLabel("Your name").fill(name);
    await page.getByLabel("Email address").fill(email);
    await page.getByRole("button", { name: "Confirm appointment" }).click();
    await expect(page.getByText("BOOKING DEPOSIT")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Demo payment disabled" }),
    ).toBeDisabled();
    const privateUrl = page.url();
    const token = privateUrl.split("#")[1];
    const guest = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false } },
    );
    const receipt = await guest.rpc("manage_booking", {
      p_host: "porto-gentlemen.localhost",
      p_token: token,
    });
    expect(receipt.error).toBeNull();
    appointment = receipt.data.id;
    const appointmentRow = await admin
      .from("appointments")
      .select("customer_id")
      .eq("id", appointment)
      .single();
    customer = appointmentRow.data!.customer_id;

    await page.goto(
      "http://127.0.0.1:3000/workspace/porto-gentlemen/revenue-protection",
    );
    const actionCard = page
      .locator(".protection-card")
      .filter({ hasText: name });
    await expect(actionCard).toBeVisible();
    await actionCard
      .getByRole("button", { name: "Record deposit paid" })
      .click();
    await expect
      .poll(async () => {
        const payments = await admin
          .from("appointment_deposit_payments")
          .select("status")
          .eq("appointment_id", appointment);
        return payments.data?.[0]?.status;
      })
      .toBe("paid");

    await page.goto(privateUrl);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Cancel appointment" }).click();
    await expect(page.getByText("Your deposit refund is due.")).toBeVisible();

    await page.goto(
      "http://127.0.0.1:3000/workspace/porto-gentlemen/revenue-protection",
    );
    const refundCard = page
      .locator(".protection-card")
      .filter({ hasText: name });
    await expect(
      refundCard.getByText("Refund due", { exact: true }),
    ).toBeVisible();
    await refundCard.getByRole("button", { name: "Refund deposit" }).click();
    await expect
      .poll(async () => {
        const payments = await admin
          .from("appointment_deposit_payments")
          .select("status")
          .eq("appointment_id", appointment);
        return payments.data?.[0]?.status;
      })
      .toBe("refunded");
  } finally {
    if (!customer) {
      const found = await admin
        .from("customers")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      customer = found.data?.id ?? "";
    }
    if (appointment)
      await admin.from("appointments").delete().eq("id", appointment);
    if (customer) await admin.from("customers").delete().eq("id", customer);
    if (original.data)
      await admin
        .from("revenue_protection_policies")
        .update({
          enabled: original.data.enabled,
          deposit_rule: original.data.deposit_rule,
          deposit_percent: original.data.deposit_percent,
          cancellation_window_hours: original.data.cancellation_window_hours,
          reminder_lead_hours: original.data.reminder_lead_hours,
          version: original.data.version,
        })
        .eq("tenant_id", tenant);
  }
});
