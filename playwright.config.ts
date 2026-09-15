import { defineConfig } from "@playwright/test";
import { loadEnvFile } from "node:process";
loadEnvFile(".env.local");
if (
  !["127.0.0.1", "localhost"].includes(
    new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname,
  )
)
  throw new Error("Browser tests may only use local Supabase.");
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  expect: { timeout: process.env.CI ? 15000 : 5000 },
  use: {
    baseURL: "http://127.0.0.1:3000",
    browserName: "chromium",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: "http://127.0.0.1:3000/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
