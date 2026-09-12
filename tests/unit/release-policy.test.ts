import { it, expect } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
function run(
  script: string,
  env: Record<string, string>,
  response: unknown = [],
) {
  const dir = mkdtempSync(join(tmpdir(), "release-policy-"));
  try {
    writeFileSync(
      join(dir, "gh"),
      '#!/bin/sh\nprintf "%s" "$TEST_GH_RESPONSE"\n',
      { mode: 0o700 },
    );
    const result = spawnSync(process.execPath, [resolve("scripts", script)], {
      encoding: "utf8",
      env: {
        NODE_ENV: "test",
        PATH: `${dir}:${process.env.PATH}`,
        GITHUB_REPOSITORY: "owner/repo",
        GITHUB_SHA: "abc",
        GITHUB_OUTPUT: join(dir, "output"),
        TEST_GH_RESPONSE: JSON.stringify(response),
        ...env,
      },
    });
    return result.status;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
const merged = {
  merged_at: "2026-09-12",
  merge_commit_sha: "abc",
  base: { ref: "production" },
  head: { ref: "main", repo: { full_name: "owner/repo" } },
  number: 1,
};
it("rejects direct pushes and unmerged releases", () => {
  expect(run("check-release.mjs", { GITHUB_REF_NAME: "main" })).not.toBe(0);
  expect(
    run("check-release.mjs", { GITHUB_REF_NAME: "production" }, [
      { ...merged, merged_at: null },
    ]),
  ).not.toBe(0);
});
it("permits only the matching merged main release into production", () => {
  expect(
    run("check-release.mjs", { GITHUB_REF_NAME: "production" }, [merged]),
  ).toBe(0);
  expect(
    run("check-release.mjs", { GITHUB_REF_NAME: "production" }, [
      { ...merged, merge_commit_sha: "other" },
    ]),
  ).not.toBe(0);
  expect(
    run("check-release.mjs", { GITHUB_REF_NAME: "production" }, [
      {
        ...merged,
        head: { ref: "feature", repo: { full_name: "owner/repo" } },
      },
    ]),
  ).not.toBe(0);
});
const target = {
  DEPLOY_ENABLED: "true",
  DEPLOY_ENVIRONMENT: "production",
  SUPABASE_PROJECT_REF: "abcdefghijklmnopqrst",
  VERCEL_PROJECT_ID: "prj_production",
  VERCEL_ORG_ID: "team_owner",
  APP_ORIGIN: "https://workspace.example.com",
};
it("requires enabled production with separate resources and reviewers", () => {
  const approval = {
    protection_rules: [{ type: "required_reviewers", reviewers: [{ id: 1 }] }],
  };
  expect(run("check-deploy-target.mjs", target, approval)).toBe(0);
  expect(run("check-deploy-target.mjs", target, {})).not.toBe(0);
  expect(
    run(
      "check-deploy-target.mjs",
      { ...target, DEPLOY_ENABLED: "false" },
      approval,
    ),
  ).not.toBe(0);
  expect(
    run(
      "check-deploy-target.mjs",
      { ...target, SUPABASE_PROJECT_REF: "atliuoyvxnpetqhwfakm" },
      approval,
    ),
  ).not.toBe(0);
});
