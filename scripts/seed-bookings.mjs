import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
const config = readFileSync("supabase/config.toml", "utf8");
const project = config.match(/^project_id = "([a-zA-Z0-9_-]+)"/m)?.[1];
if (!project) throw new Error("Cannot identify the local demo database.");
execFileSync(
  "docker",
  [
    "exec",
    "-i",
    `supabase_db_${project}`,
    "psql",
    "-X",
    "-U",
    "postgres",
    "-d",
    "postgres",
    "-v",
    "ON_ERROR_STOP=1",
  ],
  {
    input: readFileSync("supabase/demo-bookings.sql"),
    stdio: ["pipe", "pipe", "pipe"],
  },
);
console.log(
  "Local fictional calendar fixtures are ready. Existing appointments were preserved.",
);
