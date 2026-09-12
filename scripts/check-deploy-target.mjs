import { execFileSync } from "node:child_process";
const e = process.env;
if (e.DEPLOY_ENABLED !== "true")
  throw new Error(
    "This deployment environment is not enabled. Complete provisioning and approvals first.",
  );
if (
  !/^[a-z]{20}$/.test(e.SUPABASE_PROJECT_REF ?? "") ||
  !e.VERCEL_PROJECT_ID?.startsWith("prj_") ||
  !e.VERCEL_ORG_ID?.startsWith("team_")
)
  throw new Error("Missing deployment project identifiers.");
if (!e.APP_ORIGIN?.startsWith("https://"))
  throw new Error("An HTTPS workspace origin is required.");
const stage = {
  db: "atliuoyvxnpetqhwfakm",
  project: "prj_BUOlUKCaZf8kTgA9PEkzO8TZKxfb",
  origin: "https://barbershop-os-staging.vercel.app",
};
if (e.DEPLOY_ENVIRONMENT === "staging") {
  if (
    e.SUPABASE_PROJECT_REF !== stage.db ||
    e.VERCEL_PROJECT_ID !== stage.project ||
    e.APP_ORIGIN !== stage.origin
  )
    throw new Error(
      "Staging identifiers differ from the registered staging environment.",
    );
} else if (e.DEPLOY_ENVIRONMENT === "production") {
  if (
    e.SUPABASE_PROJECT_REF === stage.db ||
    e.VERCEL_PROJECT_ID === stage.project ||
    e.APP_ORIGIN === stage.origin
  )
    throw new Error("Production must not use staging resources.");
  const environment = JSON.parse(
    execFileSync(
      "gh",
      ["api", `repos/${e.GITHUB_REPOSITORY}/environments/production`],
      { encoding: "utf8" },
    ),
  );
  if (
    !environment.protection_rules?.some(
      (r) => r.type === "required_reviewers" && r.reviewers?.length,
    )
  )
    throw new Error("Production must have required environment reviewers.");
} else throw new Error("Unknown deployment environment.");
console.log(`Validated ${e.DEPLOY_ENVIRONMENT} deployment destination.`);
