import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createClient } from "@supabase/supabase-js";

test("owner reviews explainable rebooking opportunities from the daily brief", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("owner@porto-gentlemen.example");
  await page.getByLabel("Password", { exact: true }).fill("PortoDemo!2026");
  await page.getByRole("button", { name: "Sign in to your workspace" }).click();
  await expect(page).toHaveURL("/workspace/porto-gentlemen");

  const opportunity = page.getByRole("link", { name: /Customers due/ });
  await expect(opportunity).toBeVisible();
  await opportunity.click();
  await expect(page).toHaveURL(
    "/workspace/porto-gentlemen/opportunities/rebooking",
  );
  await expect(
    page.getByRole("heading", { name: "Right customer. Right moment." }),
  ).toBeVisible();
  await expect(
    page.getByText(/Usually returns every \d+ days/).first(),
  ).toBeVisible();
  await expect(page.getByText("not recovered revenue").first()).toBeVisible();
  await expect(page.getByText("No marketing opt-in").first()).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Book next visit" }).first(),
  ).toBeVisible();

  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("rebooking opportunities follow the Portuguese workspace language", async ({
  page,
}) => {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  const tenant = "11111111-1111-4111-8111-111111111111";
  try {
    expect(
      (
        await db
          .from("tenants")
          .update({ workspace_locale: "pt" })
          .eq("id", tenant)
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
    await page.goto("/workspace/porto-gentlemen/opportunities/rebooking");

    await expect(
      page.getByRole("heading", {
        name: "O cliente certo. No momento certo.",
      }),
    ).toBeVisible();
    await expect(
      page.getByText(/Regressa habitualmente a cada \d+ dias/).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Marcar próxima visita" }).first(),
    ).toBeVisible();
    await expect(
      page.getByText("Sem consentimento de marketing").first(),
    ).toBeVisible();
    await expect(page.locator("body")).not.toContainText(
      "Right customer. Right moment.",
    );
  } finally {
    await db
      .from("tenants")
      .update({ workspace_locale: "en" })
      .eq("id", tenant);
  }
});
