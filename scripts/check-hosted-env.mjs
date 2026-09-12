// Run before a hosted build; deliberately does not load local .env files.
import { pathToFileURL } from "node:url";

export function checkHostedEnv(env) {
  const errors = [];
  for (const name of ["APP_ORIGIN", "NEXT_PUBLIC_SUPABASE_URL"]) {
    try {
      const url = new URL(env[name]);
      if (
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        url.port ||
        url.pathname !== "/" ||
        url.search ||
        url.hash ||
        !url.hostname.includes(".") ||
        url.hostname.endsWith(".localhost") ||
        url.hostname.endsWith(".invalid") ||
        /^[\d.]+$/.test(url.hostname)
      )
        throw new Error();
    } catch {
      errors.push(
        `${name} must be a hosted HTTPS origin without a path or credentials.`,
      );
    }
  }
  if (!env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.startsWith("sb_publishable_"))
    errors.push("Use the staging project's Supabase publishable key.");
  if (env.LOCAL_DEMO !== "false")
    errors.push("Set LOCAL_DEMO=false for hosting.");
  for (const name of [
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_SECRET_KEY",
    "SUPABASE_ACCESS_TOKEN",
    "SUPABASE_DB_PASSWORD",
    "DATABASE_URL",
    "SUPABASE_JWT_SECRET",
    "POSTGRES_URL",
    "POSTGRES_PRISMA_URL",
    "POSTGRES_URL_NON_POOLING",
    "POSTGRES_PASSWORD",
  ])
    if (env[name])
      errors.push(
        `Remove ${name} from the application build/runtime environment.`,
      );
  return errors;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const errors = checkHostedEnv(process.env);
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else
    console.log("Hosted environment checks passed (credentials not printed).");
}
