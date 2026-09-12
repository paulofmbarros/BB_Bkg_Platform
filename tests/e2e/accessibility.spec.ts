import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("owner screens and customer page meet automated WCAG AA checks", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("owner@porto-gentlemen.example");
  await page.getByLabel("Password", { exact: true }).fill("PortoDemo!2026");
  await page.getByRole("button", { name: "Sign in to your workspace" }).click();
  await expect(page).toHaveURL("/workspace/porto-gentlemen");
  for (const path of [
    "/workspace/porto-gentlemen",
    "/workspace/porto-gentlemen/services",
    "/workspace/porto-gentlemen/hours",
    "/preview/porto-gentlemen",
  ]) {
    await page.goto(path);
    await page
      .locator(path.startsWith("/preview") ? ".shop-page" : ".main-content")
      .waitFor();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
      path,
    ).toEqual([]);
  }
});
