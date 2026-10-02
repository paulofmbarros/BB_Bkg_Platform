"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireMemberManager } from "@/modules/tenancy/context";
export async function rebookCustomer(
  slug: string,
  input: unknown,
): Promise<{ ok: boolean; message: string; id?: string }> {
  const { db, tenant } = await requireMemberManager(slug);
  const parsed = z
    .object({
      customer: z.uuid(),
      version: z.number().int().positive(),
      service: z.uuid(),
      staff: z.uuid(),
      start: z.iso.datetime({ offset: true }),
      price: z.number().int().nonnegative(),
      duration: z.number().int().positive(),
      request: z.uuid(),
      outreach: z.uuid().optional(),
    })
    .safeParse(input);
  if (!parsed.success)
    return { ok: false, message: "Check the booking details." };
  const v = parsed.data;
  const booking = {
    p_tenant: tenant.id,
    p_customer: v.customer,
    p_customer_version: v.version,
    p_service: v.service,
    p_staff: v.staff,
    p_start: v.start,
    p_price: v.price,
    p_duration: v.duration,
    p_request: v.request,
  };
  const { data, error } = v.outreach
    ? await db.rpc("rebook_customer_from_outreach", {
        ...booking,
        p_outreach: v.outreach,
      })
    : await db.rpc("rebook_customer", booking);
  if (error)
    return {
      ok: false,
      message:
        error.code === "P0001"
          ? error.message
          : "This appointment could not be booked.",
    };
  revalidatePath(`/workspace/${slug}/customers`, "layout");
  revalidatePath(`/workspace/${slug}/calendar`);
  revalidatePath(`/workspace/${slug}/opportunities/rebooking`);
  return {
    ok: true,
    message: v.outreach
      ? "Next visit booked and attributed to outreach."
      : "Next visit booked.",
    id: data,
  };
}
