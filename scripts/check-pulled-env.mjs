import { loadEnvFile } from "node:process";
import { checkHostedEnv } from "./check-hosted-env.mjs";
const expectedProject = process.env.EXPECTED_SUPABASE_PROJECT_REF;
const expectedOrigin = process.env.EXPECTED_APP_ORIGIN;
if (!expectedProject || !expectedOrigin)
  throw new Error("Missing expected deployment destination.");
loadEnvFile(".vercel/.env.production.local");
const errors = checkHostedEnv(process.env);
if (
  process.env.NEXT_PUBLIC_SUPABASE_URL !==
    `https://${expectedProject}.supabase.co` ||
  process.env.APP_ORIGIN !== expectedOrigin
)
  errors.push(
    "Vercel environment does not match the selected database/workspace.",
  );
if (errors.length) throw new Error(errors.join("\n"));
console.log("Pulled build settings match the selected deployment environment.");
