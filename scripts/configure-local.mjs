import { execFileSync } from "node:child_process";
import { writeFileSync, existsSync } from "node:fs";
if (existsSync(".env.local"))
  throw new Error(".env.local already exists. Refusing to overwrite it.");
const raw = execFileSync("npx", ["supabase", "status", "-o", "json"], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "ignore"],
});
const env = JSON.parse(raw);
writeFileSync(
  ".env.local",
  [
    `NEXT_PUBLIC_SUPABASE_URL=${env.API_URL}`,
    `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${env.PUBLISHABLE_KEY}`,
    `SUPABASE_SERVICE_ROLE_KEY=${env.SERVICE_ROLE_KEY}`,
    "APP_ORIGIN=http://127.0.0.1:3000",
    "PLATFORM_DOMAIN=localhost",
    "LOCAL_DEMO=true",
    "",
  ].join("\n"),
  { mode: 0o600 },
);
console.log("Local connection settings saved to .env.local.");
