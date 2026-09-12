import { describe, expect, it } from "vitest";
import { checkHostedEnv } from "../../scripts/check-hosted-env.mjs";
const valid = {
  APP_ORIGIN: "https://workspace.example.com",
  NEXT_PUBLIC_SUPABASE_URL: "https://staging-project.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_synthetic_test_value",
  LOCAL_DEMO: "false",
};
describe("hosted configuration guard", () => {
  it("accepts public credentials with HTTPS origins", () => {
    expect(checkHostedEnv(valid)).toEqual([]);
  });
  it("rejects missing or local settings", () => {
    expect(checkHostedEnv({}).length).toBeGreaterThan(0);
    for (const origin of [
      "http://127.0.0.1:54321",
      "https://porto.localhost",
      "https://example.com/path",
      "https://user:password@example.com",
      "https://127.0.0.1",
    ]) {
      expect(
        checkHostedEnv({ ...valid, APP_ORIGIN: origin }).length,
      ).toBeGreaterThan(0);
    }
  });
  it("rejects privileged credentials without disclosing their values", () => {
    const errors = checkHostedEnv({
      ...valid,
      SUPABASE_SERVICE_ROLE_KEY: "private-test-value",
    });
    expect(errors.join()).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(errors.join()).not.toContain("private-test-value");
    expect(
      checkHostedEnv({
        ...valid,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_test",
      }).length,
    ).toBeGreaterThan(0);
  });
  it("requires the local demo shortcut to be explicitly disabled", () => {
    expect(
      checkHostedEnv({ ...valid, LOCAL_DEMO: "true" }).length,
    ).toBeGreaterThan(0);
  });
});
