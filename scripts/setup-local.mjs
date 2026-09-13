import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function assertLocalEnvironment() {
  const contents = readFileSync(".env.local", "utf8");
  const url = contents.match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1];
  if (!url || !["127.0.0.1", "localhost"].includes(new URL(url).hostname)) {
    throw new Error(
      ".env.local must point to local Supabase before demo data can be created.",
    );
  }
}

console.log("Starting local Supabase...");
run(npm, ["run", "db:start"]);

if (!existsSync(".env.local")) {
  run(process.execPath, ["scripts/configure-local.mjs"]);
} else {
  assertLocalEnvironment();
  console.log("Using the existing local .env.local file.");
}

if (!existsSync("supabase/functions/.env")) {
  copyFileSync("supabase/functions/.env.example", "supabase/functions/.env");
  console.log("Created supabase/functions/.env from the local example.");
}

for (const script of [
  "demo:users",
  "demo:bookings",
  "demo:history",
  "demo:segments",
]) {
  run(npm, ["run", script]);
}

console.log("Local setup is ready. Run npm run dev:all to start the app.");
