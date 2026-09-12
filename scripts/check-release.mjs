import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
const {
  GITHUB_REPOSITORY: repo,
  GITHUB_SHA: sha,
  GITHUB_REF_NAME: branch,
} = process.env;
if (!repo || !sha || !["main", "production"].includes(branch))
  throw new Error("Unexpected release context.");
const pulls = JSON.parse(
  execFileSync("gh", ["api", `repos/${repo}/commits/${sha}/pulls`], {
    encoding: "utf8",
  }),
);
const pull = pulls.find(
  (p) =>
    p.merged_at &&
    p.merge_commit_sha === sha &&
    p.base.ref === branch &&
    p.head.repo?.full_name === repo &&
    (branch !== "production" || p.head.ref === "main"),
);
if (!pull)
  throw new Error(
    "Deployments require a merged PR. Production releases must come from main.",
  );
appendFileSync(
  process.env.GITHUB_OUTPUT,
  `environment=${branch === "main" ? "staging" : "production"}\n`,
);
console.log(`Verified merged PR #${pull.number} into ${branch}.`);
