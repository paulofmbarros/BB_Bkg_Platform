"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMemberManager } from "@/modules/tenancy/context";

export type RecoveryActionResult = {
  ok: boolean;
  message: string;
  id?: string;
};

const id = z.uuid();
const actionError = (
  error: { code?: string; message?: string },
  fallback: string,
) => ({
  ok: false,
  message: error.code === "P0001" ? error.message! : fallback,
});

function refresh(slug: string) {
  revalidatePath(`/workspace/${slug}`);
  revalidatePath(`/workspace/${slug}/calendar`);
  revalidatePath(`/workspace/${slug}/revenue-recovery`);
  revalidatePath(`/workspace/${slug}/customers`);
}

export async function createWaitlistEntry(
  slug: string,
  _previous: RecoveryActionResult,
  form: FormData,
): Promise<RecoveryActionResult> {
  void _previous;
  const { db, tenant } = await requireMemberManager(slug);
  const parsed = z
    .object({
      customer: id,
      service: id,
      staff: z.preprocess(
        (value) => (value === "" ? null : value),
        id.nullable(),
      ),
      earliest: z.iso.date(),
      latest: z.iso.date(),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { ok: false, message: "Check the waitlist request details." };
  const { data, error } = await db.rpc("create_waitlist_entry", {
    p_tenant: tenant.id,
    p_customer: parsed.data.customer,
    p_service: parsed.data.service,
    // The generated RPC argument type cannot express nullable PostgreSQL
    // parameters; the function deliberately accepts null for "any staff".
    p_staff: parsed.data.staff as string,
    p_earliest: parsed.data.earliest,
    p_latest: parsed.data.latest,
  });
  if (error)
    return actionError(error, "The waitlist request could not be added.");
  refresh(slug);
  return { ok: true, message: "Customer added to the waitlist.", id: data };
}

export async function closeWaitlistEntry(
  slug: string,
  entryId: string,
  _previous: RecoveryActionResult,
  _form: FormData,
): Promise<RecoveryActionResult> {
  void _previous;
  void _form;
  const { db, tenant } = await requireMemberManager(slug);
  if (!id.safeParse(entryId).success)
    return { ok: false, message: "Invalid waitlist request." };
  const { error } = await db.rpc("close_waitlist_entry", {
    p_tenant: tenant.id,
    p_entry: entryId,
  });
  if (error)
    return actionError(error, "The waitlist request could not be closed.");
  refresh(slug);
  return { ok: true, message: "Waitlist request closed." };
}

export async function recordRecoveryContact(
  slug: string,
  entryId: string,
  sourceId: string,
  _previous: RecoveryActionResult,
  form: FormData,
): Promise<RecoveryActionResult> {
  const { db, tenant } = await requireMemberManager(slug);
  const parsed = z
    .object({
      message: z.string().trim().min(1).max(600),
      confirmed: z.literal("on"),
    })
    .safeParse(Object.fromEntries(form));
  if (
    !parsed.success ||
    !id.safeParse(entryId).success ||
    !id.safeParse(sourceId).success
  )
    return {
      ok: false,
      message:
        "Enter the sent message and confirm that you contacted the customer.",
    };
  const { data, error } = await db.rpc("record_waitlist_recovery_contact", {
    p_tenant: tenant.id,
    p_entry: entryId,
    p_source: sourceId,
    p_message: parsed.data.message,
    p_confirmed: true,
  });
  if (error)
    return actionError(error, "The recovery contact could not be recorded.");
  refresh(slug);
  return { ok: true, message: "Recovery contact recorded.", id: data };
}

export async function bookRecovery(
  slug: string,
  actionId: string,
  _previous: RecoveryActionResult,
  form: FormData,
): Promise<RecoveryActionResult> {
  const { db, tenant } = await requireMemberManager(slug);
  const parsed = z
    .object({ request: id, accepted: z.literal("on") })
    .safeParse(Object.fromEntries(form));
  if (!id.safeParse(actionId).success || !parsed.success)
    return { ok: false, message: "Invalid recovery booking." };
  const { data, error } = await db.rpc("book_waitlist_recovery", {
    p_tenant: tenant.id,
    p_action: actionId,
    p_request: parsed.data.request,
  });
  if (error)
    return actionError(error, "The released time could not be booked.");
  refresh(slug);
  return {
    ok: true,
    message: "Released time booked and attributed to recovery.",
    id: data,
  };
}
