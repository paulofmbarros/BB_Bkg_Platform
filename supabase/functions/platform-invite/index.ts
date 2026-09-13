import { createClient } from "npm:@supabase/supabase-js@2.116.0";

// This function owns only invitation delivery. Business mutations use caller RLS.
// Gateway verification is disabled for modern signing keys; getUser verifies every caller.
Deno.serve(async (request: Request) => {
  const response = (status: number, message: string, ok = false) =>
    Response.json(
      { ok, message },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  if (request.method !== "POST") return response(405, "POST required");
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer "))
    return response(401, "Sign in required");
  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const origin = Deno.env.get("PLATFORM_APP_ORIGIN");
  if (!origin) return response(503, "Invitation delivery is not configured");
  let appOrigin: URL;
  try {
    appOrigin = new URL(origin);
    if (
      appOrigin.origin !== origin ||
      (appOrigin.protocol !== "https:" &&
        !(
          appOrigin.protocol === "http:" &&
          ["localhost", "127.0.0.1"].includes(appOrigin.hostname)
        ))
    )
      throw new Error();
  } catch {
    return response(503, "Invalid invitation configuration");
  }
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const caller = createClient(url, anonKey, {
    ...options,
    global: { headers: { Authorization: authorization } },
  });
  const {
    data: { user },
    error: userError,
  } = await caller.auth.getUser(authorization.slice(7));
  if (userError || !user) return response(401, "Sign in required");
  const { data: allowed, error: authError } =
    await caller.rpc("is_platform_admin");
  if (authError || !allowed) return response(403, "Platform access required");
  let id: string;
  try {
    const body = await request.json();
    id = body.invitation_id;
    if (
      typeof id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      )
    )
      throw new Error();
  } catch {
    return response(400, "Invalid invitation");
  }
  const admin = createClient(url, serviceKey, options);
  const { data: invite, error: claimError } = await admin.rpc(
    "claim_platform_invitation",
    { p_id: id, p_actor: user.id },
  );
  if (claimError || !invite)
    return response(409, "Invitation unavailable or recently sent");
  try {
    const redirectTo = `${appOrigin.origin}/accept-invite/${id}`;
    let { error } = await admin.auth.admin.inviteUserByEmail(invite.email, {
      redirectTo,
    });
    // Existing accounts use a magic link, with account creation explicitly disabled.
    if (
      error?.code === "email_exists" ||
      error?.code === "user_already_exists"
    ) {
      const mailer = createClient(url, anonKey, options);
      ({ error } = await mailer.auth.signInWithOtp({
        email: invite.email,
        options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
      }));
    }
    const { error: saveError } = await admin
      .from("platform_invitations")
      .update({
        delivery_state: error ? "failed" : "sent",
        delivery_error: error
          ? "Email could not be sent. Check delivery configuration or retry later."
          : null,
        ...(error ? {} : { sent_at: new Date().toISOString() }),
      })
      .eq("id", id)
      .eq("attempt_id", invite.attempt_id);
    if (saveError)
      return response(
        503,
        "Delivery status could not be saved; the email may have been sent",
      );
    return error
      ? response(502, "Email delivery failed")
      : response(200, "Invitation submitted", true);
  } catch {
    await admin
      .from("platform_invitations")
      .update({
        delivery_state: "failed",
        delivery_error:
          "Delivery was interrupted. The email may have been sent; retry later if needed.",
      })
      .eq("id", id)
      .eq("attempt_id", invite.attempt_id);
    return response(503, "Email delivery interrupted");
  }
});
