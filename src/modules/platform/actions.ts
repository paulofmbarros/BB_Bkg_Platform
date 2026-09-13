"use server";
import { resolveTxt } from "node:dns/promises";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSessionClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "./queries";
import {
  clientSchema,
  hostnameSchema,
  newClientSchema,
  type PlatformData,
} from "./model";
import type { ActionResult } from "@/modules/businesses/actions";
const uuid = z.uuid();
const initialFailure = {
  ok: false,
  message: "The change could not be saved. Refresh the page and try again.",
};

export async function createPlatformClient(
  _previous: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const { db } = await requirePlatformAdmin();
  const input = newClientSchema.safeParse(Object.fromEntries(form));
  if (!input.success)
    return { ok: false, message: input.error.issues[0].message };
  const { data, error } = await db.rpc("platform_mutate", {
    p_action: "create",
    p_tenant: null as unknown as string,
    p_payload: input.data,
  });
  if (error)
    return {
      ok: false,
      message:
        error.code === "23505"
          ? "That shop identifier is already in use. Choose another."
          : "Could not create the workspace. Check the details and try again.",
    };
  revalidatePath("/admin");
  redirect(`/admin/clients/${data}`);
}

export async function managePlatformClient(
  id: string,
  operation: string,
  _previous: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const { db } = await requirePlatformAdmin();
  if (!uuid.safeParse(id).success) return initialFailure;
  let payload: Record<string, string | boolean>;
  let success = "Changes saved.";
  try {
    switch (operation) {
      case "update":
        payload = {
          ...clientSchema.parse(Object.fromEntries(form)),
          active: form.get("active") === "on",
          foundation: form.get("foundation") === "on",
          booking: form.get("booking") === "on",
        };
        break;
      case "invite":
        payload = {
          email: z.email().max(254).parse(form.get("email")).toLowerCase(),
        };
        success = "Invitation created. Use Send invitation to email the owner.";
        break;
      case "cancel_invite":
        payload = { id: uuid.parse(form.get("id")) };
        success = "Invitation cancelled.";
        break;
      case "membership":
        payload = {
          user_id: uuid.parse(form.get("user_id")),
          active: form.get("active") === "true",
        };
        success = "Access updated.";
        break;
      case "domain_add":
      case "domain_remove":
      case "domain_verify": {
        const hostname = hostnameSchema.parse(form.get("hostname"));
        if (hostname === new URL(process.env.APP_ORIGIN!).hostname)
          return {
            ok: false,
            message:
              "The platform workspace address cannot be assigned to a shop.",
          };
        payload = { hostname };
        if (operation === "domain_verify") {
          const { data, error } = await db.rpc("platform_clients", {
            p_id: id,
          });
          if (error) return initialFailure;
          const domain = (
            data as unknown as PlatformData
          ).clients[0]?.domains.find((d) => d.hostname === hostname);
          if (!domain) return initialFailure;
          let records: string[][];
          try {
            records = await resolveTxt(`_barbershop-os.${hostname}`);
          } catch {
            return {
              ok: false,
              message:
                "The verification record was not found. Check your DNS settings and try again after they update.",
            };
          }
          if (
            !records.some(
              (record) =>
                record.join("") ===
                `barbershop-os=${domain.verification_token}`,
            )
          )
            return {
              ok: false,
              message:
                "The DNS record does not match the verification value below.",
            };
          payload.token = domain.verification_token;
          success =
            "Domain ownership verified. Its hosting connection must also be configured.";
        } else
          success =
            operation === "domain_add"
              ? "Address added. Follow the verification instructions below."
              : "Address removed.";
        break;
      }
      default:
        return initialFailure;
    }
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof z.ZodError
          ? error.issues[0].message
          : initialFailure.message,
    };
  }
  const { error } = await db.rpc("platform_mutate", {
    p_action: operation,
    p_tenant: id,
    p_payload: payload,
  });
  if (error)
    return {
      ok: false,
      message:
        error.code === "23505"
          ? "That invitation or address already exists."
          : error.code === "P0001"
            ? error.message
            : initialFailure.message,
    };
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
  return { ok: true, message: success };
}

export async function sendOwnerInvitation(
  id: string,
  _previous: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const { db } = await requirePlatformAdmin();
  const invitation = uuid.safeParse(form.get("id"));
  if (!uuid.safeParse(id).success || !invitation.success) return initialFailure;
  const { data: record } = await db
    .from("platform_invitations")
    .select("id")
    .eq("id", invitation.data)
    .eq("tenant_id", id)
    .single();
  if (!record) return initialFailure;
  const { data, error } = await db.functions.invoke("platform-invite", {
    body: { invitation_id: invitation.data },
  });
  revalidatePath("/admin", "layout");
  if (error || !data?.ok)
    return {
      ok: false,
      message:
        "The invitation could not be sent. Check its delivery status below. If it was just sent, wait two minutes before retrying; otherwise check the invitation service and email configuration.",
    };
  return {
    ok: true,
    message:
      "Invitation submitted to the email provider. The owner has seven days from creation to accept.",
  };
}

export async function acceptOwnerInvitation(
  id: string,
  _previous: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return initialFailure;
  const db = await createSessionClient();
  const access = form.get("access_token"),
    refresh = form.get("refresh_token");
  // Auth's invitation link supplies a session fragment; verify it before using it.
  if (
    typeof access === "string" &&
    access &&
    typeof refresh === "string" &&
    refresh &&
    access.length < 10000 &&
    refresh.length < 10000
  ) {
    const { error } = await db.auth.setSession({
      access_token: access,
      refresh_token: refresh,
    });
    if (error)
      return {
        ok: false,
        message:
          "This email link has expired. Ask the platform administrator to resend it.",
      };
  }
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user)
    return {
      ok: false,
      message: "Open your invitation email and follow its link to continue.",
    };
  const { data, error } = await db.rpc("accept_platform_invitation", {
    p_id: id,
  });
  if (error)
    return {
      ok: false,
      message:
        "This invitation is unavailable, already accepted, or belongs to a different email. If you already accepted it, sign in to your workspace.",
    };
  if (access) redirect("/reset-password?invited=1");
  redirect(`/workspace/${data}`);
}
