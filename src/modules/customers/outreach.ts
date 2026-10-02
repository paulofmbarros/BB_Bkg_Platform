"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireMemberManager } from "@/modules/tenancy/context";
import { outreachActionSchema } from "./outreach-model";

export async function recordCustomerOutreach(
  slug: string,
  customerId: string,
  _previous: { ok: boolean; message: string; id?: string },
  form: FormData,
) {
  const { db, tenant } = await requireMemberManager(slug);
  const parsed = z
    .object({
      message: z.string().trim().min(1).max(600),
      confirmed: z.literal("on"),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success || !z.uuid().safeParse(customerId).success)
    return {
      ok: false,
      message:
        "Enter the sent message and confirm that you contacted the customer.",
    };
  const { data, error } = await db.rpc("record_customer_outreach", {
    p_tenant: tenant.id,
    p_customer: customerId,
    p_message: parsed.data.message,
    p_confirmed: true,
  });
  if (error)
    return {
      ok: false,
      message:
        error.code === "P0001"
          ? error.message
          : "The outreach could not be recorded.",
    };
  revalidatePath(`/workspace/${slug}`, "layout");
  revalidatePath(`/workspace/${slug}/opportunities/rebooking`);
  revalidatePath(`/workspace/${slug}/customers/${customerId}`);
  return { ok: true, message: "Outreach recorded for attribution.", id: data };
}

export async function getBookingOutreach(
  slug: string,
  customerId: string,
  outreachId: string,
) {
  const { db, tenant } = await requireMemberManager(slug);
  if (
    !z.uuid().safeParse(customerId).success ||
    !z.uuid().safeParse(outreachId).success
  )
    notFound();
  const { data, error } = await db
    .from("customer_outreach_actions")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("customer_id", customerId)
    .eq("id", outreachId)
    .is("attributed_appointment_id", null)
    .gte(
      "contacted_at",
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    )
    .maybeSingle();
  if (error || !data) notFound();
  return outreachActionSchema.parse(data);
}
