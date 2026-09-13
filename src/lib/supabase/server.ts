import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

function credentials() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    throw new Error(
      "Supabase is not configured. Follow README.md to start the local environment.",
    );
  return { url, key };
}
export async function createSessionClient() {
  const { url, key } = credentials();
  const store = await cookies();
  return createServerClient<Database>(url, key, {
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.APP_ORIGIN?.startsWith("https://") ?? false,
    },
    cookies: {
      getAll: () => store.getAll(),
      setAll: (values) => {
        try {
          values.forEach(({ name, value, options }) =>
            store.set(name, value, options),
          );
        } catch {
          /* Server Components cannot set cookies. Proxy refreshes the session. */
        }
      },
    },
  });
}
export function createPublicClient() {
  const { url, key } = credentials();
  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function createSupportClient() {
  const { url } = credentials();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key)
    throw new Error(
      "Supabase support access is not configured. Set SUPABASE_SERVICE_ROLE_KEY on the server.",
    );
  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
