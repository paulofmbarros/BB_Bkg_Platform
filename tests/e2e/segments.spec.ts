import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("owner filters segments and reads the explanation and rules", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("owner@porto-gentlemen.example");
  await page.getByLabel("Password", { exact: true }).fill("PortoDemo!2026");
  await page.getByRole("button", { name: "Sign in to your workspace" }).click();
  await expect(page).toHaveURL("/workspace/porto-gentlemen");
  await page.goto("/workspace/porto-gentlemen/customers");
  const nav = page.getByRole("navigation", { name: "Customer segments" });
  await nav.getByRole("link", { name: /^At risk/ }).click();
  await expect(page).toHaveURL(/segment=at_risk/);
  const card = page
    .locator(".customer-row")
    .filter({ hasText: "Filipe Monteiro" });
  await expect(card).toBeVisible();
  await card.click();
  await expect(
    page.getByRole("heading", { name: "Why this segment?" }),
  ).toBeVisible();
  await expect(page.locator(".segment-explanation")).toContainText(
    "threshold is 60 days",
  );
  await expect(
    page.getByRole("heading", { name: "Retention health" }),
  ).toBeVisible();
  await expect(page.locator(".retention-health")).toContainText(
    "recorded visits and fixed rules",
  );
  await expect(
    page.getByRole("button", { name: "Record email opt-in" }),
  ).toBeVisible();
  await page.getByText("How customer segments work", { exact: true }).click();
  await expect(page.locator(".segment-rules")).toContainText("120 days");
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
    path: "test-results/customer-segments.png",
    fullPage: true,
  });
  await page.goto(
    "/workspace/porto-gentlemen/customers?segment=inactive&q=segment-demo-2",
  );
  await expect(page.locator(".customer-row")).toHaveCount(1);
  await expect(page.locator(".customer-row")).toContainText("Eduardo Correia");
});
