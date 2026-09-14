import { test, expect, type Page } from "@playwright/test";

async function login(page: Page, role = "owner", shop = "porto-gentlemen") {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(`${role}@${shop}.example`);
  await page
    .getByLabel("Password", { exact: true })
    .fill(
      shop === "atelier-lisboa"
        ? "LisboaDemo!2026"
        : role === "staff"
          ? "StaffDemo!2026"
          : "PortoDemo!2026",
    );
  await page.getByRole("button", { name: "Sign in to your workspace" }).click();
  await expect(page).toHaveURL(`/workspace/${shop}`);
}
test("authentication protects private pages and invalid credentials fail clearly", async ({
  page,
}) => {
  await page.goto("/workspace/porto-gentlemen/services");
  await expect(page).toHaveURL("/login");
  await page.getByLabel("Email address").fill("nobody@example.com");
  await page.getByLabel("Password", { exact: true }).fill("not-a-password");
  await page.getByRole("button", { name: "Sign in to your workspace" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Unable to sign in" }),
  ).toBeVisible();
});
test("service edits survive reload and can be restored", async ({ page }) => {
  await login(page);
  await page.getByRole("link", { name: "Services", exact: true }).click();
  const card = page.locator("article").filter({
    has: page.getByRole("heading", { name: "Signature cut", exact: true }),
  });
  await card.getByRole("button", { name: "Edit service" }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Price (€)").fill("29.50");
  await dialog
    .getByRole("button", { name: "Save service", exact: true })
    .click();
  await expect(dialog.getByRole("status")).toContainText("Service updated");
  await dialog.getByRole("button", { name: "Close dialog" }).click();
  await page.reload();
  await expect(card).toContainText("€29.50");
  await card.getByRole("button", { name: "Edit service" }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Price (€)").fill("28.00");
  await dialog
    .getByRole("button", { name: "Save service", exact: true })
    .click();
  await expect(dialog.getByRole("status")).toContainText("Service updated");
  await dialog.getByRole("button", { name: "Close dialog" }).click();
  page.once("dialog", (confirmation) => confirmation.accept());
  await card.getByRole("button", { name: "Archive service" }).click();
  await expect(page.getByRole("status")).toContainText("Service archived");
  await expect(card).toHaveCount(0);
  await page.goto("http://porto-gentlemen.localhost:3000");
  await expect(
    page.getByRole("heading", { name: "Signature cut", exact: true }),
  ).toHaveCount(0);
  await page.goto("http://127.0.0.1:3000/workspace/porto-gentlemen/services");
  await page.getByRole("button", { name: /^Archived ·/ }).click();
  const archivedCard = page.locator("article").filter({
    has: page.getByRole("heading", { name: "Signature cut", exact: true }),
  });
  await expect(archivedCard).toContainText("Archived");
  await archivedCard.getByRole("button", { name: "Restore service" }).click();
  await expect(page.getByRole("status")).toContainText("Service restored");
  await expect(archivedCard).toHaveCount(0);
  await page.getByRole("button", { name: /^Current ·/ }).click();
  await expect(card).toBeVisible();
  await page.getByLabel("Search services").fill("beard");
  await expect(page.locator(".service-card")).toHaveCount(3);
});
test("shop hours, breaks and closures persist through the owner flow", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("link", { name: "Opening hours", exact: true }).click();
  await page.getByLabel("Tuesday closing time").fill("18:00");
  await page.getByRole("button", { name: "Save working hours" }).click();
  await expect(page.getByRole("status")).toContainText("Working hours saved");
  await page.reload();
  await expect(page.getByLabel("Tuesday closing time")).toHaveValue("18:00");
  await page.getByLabel("Tuesday closing time").fill("19:00");
  await page.getByRole("button", { name: "Save working hours" }).click();
  await expect(page.getByRole("status")).toContainText("Working hours saved");
  await page.getByRole("button", { name: "Add closure", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Reason").fill("Browser test closure");
  await dialog.getByLabel("First day").fill("2027-01-01");
  await dialog.getByLabel("Last day (inclusive)").fill("2027-01-01");
  await dialog
    .getByRole("button", { name: "Add closure", exact: true })
    .click();
  await expect(dialog.getByRole("status")).toContainText("Closure added");
  await dialog.getByRole("button", { name: "Close dialog" }).click();
  const row = page
    .locator(".exception-row")
    .filter({ hasText: "Browser test closure" });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Remove exception" }).click();
  await expect(row).toHaveCount(0);
});
test("staff profiles and service assignments save atomically", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("link", { name: "Team", exact: true }).click();
  const card = page.locator("article").filter({
    has: page.getByRole("heading", { name: "Rafael Costa", exact: true }),
  });
  await card.getByRole("link", { name: "Profile & working hours" }).click();
  await page.getByRole("button", { name: "Edit profile" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Role / title").fill("Senior barber · Fades");
  await dialog.getByLabel("Signature cut", { exact: true }).uncheck();
  await dialog.getByRole("button", { name: "Save team member" }).click();
  await expect(dialog.getByRole("status")).toContainText("Team member updated");
  await dialog.getByRole("button", { name: "Close dialog" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Edit profile" }).click();
  await expect(dialog.getByLabel("Role / title")).toHaveValue(
    "Senior barber · Fades",
  );
  await expect(
    dialog.getByLabel("Signature cut", { exact: true }),
  ).not.toBeChecked();
  await dialog.getByLabel("Role / title").fill("Senior barber");
  await dialog.getByLabel("Signature cut", { exact: true }).check();
  await dialog.getByRole("button", { name: "Save team member" }).click();
  await expect(dialog.getByRole("status")).toContainText("Team member updated");
});
test("branding reaches the verified public domain without leaking another shop", async ({
  page,
  browser,
}) => {
  await login(page);
  await page.getByRole("link", { name: "Brand & business" }).click();
  await page
    .getByLabel("Tagline", { exact: true })
    .fill("A cut above, together.");
  await page.getByRole("button", { name: "Save business details" }).click();
  await expect(page.getByRole("status")).toContainText(
    "business details are saved",
  );
  const guest = await browser.newPage();
  await guest.goto("http://porto-gentlemen.localhost:3000");
  await expect(guest.getByRole("heading", { level: 1 })).toHaveText(
    "A cut above, together.",
  );
  await expect(guest.locator("body")).not.toContainText("Atelier Lisboa");
  await expect(guest.locator("body")).not.toContainText("owner@");
  await expect(
    guest.getByText(
      "Demo bookings are saved locally; no payments are accepted.",
      {
        exact: false,
      },
    ),
  ).toBeVisible();
  await page
    .getByLabel("Tagline", { exact: true })
    .fill("Good hair. Good company.");
  await page.getByRole("button", { name: "Save business details" }).click();
  await expect(page.getByRole("status")).toContainText(
    "business details are saved",
  );
  await guest.goto("http://atelier-lisboa.localhost:3000");
  await expect(guest.getByRole("heading", { level: 1 })).toHaveText(
    "Made for your everyday.",
  );
  await expect(guest.locator("body")).not.toContainText("Porto Gentlemen");
  await guest.close();
});
test("other tenants and staff cannot enter management actions", async ({
  page,
}) => {
  await login(page, "owner", "atelier-lisboa");
  await page.goto("/workspace/porto-gentlemen/services");
  await expect(
    page.getByRole("heading", { name: "This page isn’t available." }),
  ).toBeVisible();
  await page.goto("/workspace/atelier-lisboa");
  await page.getByRole("button", { name: "Sign out" }).click();
  await login(page, "staff");
  await page.getByRole("link", { name: "Services", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Add service", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Edit service" })).toHaveCount(
    0,
  );
});
test("mobile navigation and the customer page fit a narrow screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("link", { name: "Opening hours", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your regular rhythm." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/owner-mobile.png",
    fullPage: true,
  });
  await page.goto("http://porto-gentlemen.localhost:3000");
  await expect(
    page.getByRole("heading", { name: "Good hair. Good company." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/customer-mobile.png",
    fullPage: true,
  });
});
