import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
const config = readFileSync("supabase/config.toml", "utf8");
const project = config.match(/^project_id = "([a-zA-Z0-9_-]+)"/m)?.[1];
if (!project) throw new Error("Cannot identify the local test database.");
for (const file of readdirSync("supabase/tests").filter((x) =>
  x.endsWith(".sql"),
)) {
  const result = execFileSync(
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
      "-t",
      "-A",
    ],
    { input: readFileSync(`supabase/tests/${file}`), encoding: "utf8" },
  );
  const plan = result.match(/^1\.\.(\d+)$/m);
  const passes = result.match(/^ok \d+\b/gm) ?? [];
  if (!plan || passes.length !== Number(plan[1]) || /^not ok/m.test(result))
    throw new Error(`${file} failed:\n${result}`);
  console.log(`${file}: ${passes.length} database assertions passed.`);
}
