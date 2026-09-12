import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import AxeBuilder from "@axe-core/playwright";
test("owner reviews a match, links profiles and undoes the link", async ({
  page,
}) => {
  const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    ),
    source = crypto.randomUUID(),
    target = crypto.randomUUID(),
    email = `link-browser-${source}@test.example`,
    tenant = "11111111-1111-4111-8111-111111111111",
    base = "/workspace/porto-gentlemen/customers";
  expect(
    (
      await db.from("customers").insert([
        {
          id: source,
          tenant_id: tenant,
          display_name: "Link source guest",
          email,
        },
        {
          id: target,
          tenant_id: tenant,
          display_name: "Link retained guest",
          email,
        },
      ])
    ).error,
  ).toBeNull();
  try {
    await page.goto("/login");
    await page
      .getByLabel("Email address")
      .fill("owner@porto-gentlemen.example");
    await page.getByLabel("Password", { exact: true }).fill("PortoDemo!2026");
    await page
      .getByRole("button", { name: "Sign in to your workspace" })
      .click();
    await expect(page).toHaveURL("/workspace/porto-gentlemen");
    await page.goto(`${base}/${source}`);
    await page
      .getByRole("link", { name: "Link to an existing profile" })
      .click();
    await page.getByRole("link", { name: /Link retained guest/ }).click();
    await expect(
      page.getByRole("heading", { name: "What will change" }),
    ).toBeVisible();
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
      path: "test-results/customer-link-review.png",
      fullPage: true,
    });
    await page
      .getByLabel("How was the identity confirmed?")
      .selectOption("customer_confirmed");
    await page
      .getByLabel("I confirmed these records belong to the same customer.")
      .check();
    await page
      .getByRole("button", { name: "Link confirmed customer records" })
      .click();
    await expect(async () => {
      expect(
        (
          await db
            .from("customers")
            .select("linked_customer_id")
            .eq("id", source)
            .single()
        ).data!.linked_customer_id,
      ).toBe(target);
    }).toPass();
    await page.goto(`${base}/${source}`);
    await expect(page).toHaveURL(`${base}/${target}`);
    await expect(
      page.getByRole("heading", { name: "Linked from Link source guest" }),
    ).toBeVisible();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Undo link", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Linked from Link source guest" }),
    ).toHaveCount(0);
    await page.goto(`${base}/${source}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Link source guest",
    );
  } finally {
    await db.from("customer_links").delete().eq("source_id", source);
    await db
      .from("customers")
      .update({ linked_customer_id: null })
      .eq("id", source);
    await db.from("customers").delete().in("id", [source, target]);
  }
});
