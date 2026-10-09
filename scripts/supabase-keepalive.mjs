import { setTimeout as delay } from "node:timers/promises";

const projectRef = process.env.SUPABASE_PROJECT_REF;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!/^[a-z]{20}$/.test(projectRef ?? "")) {
  throw new Error("Set SUPABASE_PROJECT_REF to the hosted project reference.");
}
if (!key?.startsWith("sb_publishable_")) {
  throw new Error(
    "Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to a publishable key.",
  );
}

// Reuse /api/health's database query directly, without Vercel or caching.
// The reserved hostname returns null and discloses no tenant/customer data.
const endpoint = `https://${projectRef}.supabase.co/rest/v1/rpc/get_public_shop`;
for (let attempt = 1; attempt <= 3; attempt++) {
  let response;
  let failure;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/json" },
      body: JSON.stringify({ p_hostname: "healthcheck.invalid" }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
      redirect: "error",
    });
    if (response.ok) {
      if ((await response.json()) !== null) {
        throw new Error("Unexpected health query result.");
      }
      console.log(`Supabase database check succeeded for ${projectRef}.`);
      break;
    }
  } catch {
    // Do not log request objects, response bodies or credentials.
    failure = response?.ok ? "invalid health response" : "network/timeout";
  }

  const retryable =
    !response || response.status === 429 || response.status >= 500;
  if (!retryable || attempt === 3) {
    throw new Error(
      `Supabase database check failed (${failure ?? `HTTP ${response.status}`}). Check the project status and publishable key.`,
    );
  }
  console.log(
    `Database check attempt ${attempt} failed; retrying in 5 seconds.`,
  );
  await delay(5000);
}
