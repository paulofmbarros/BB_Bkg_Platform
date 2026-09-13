"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireMemberManager } from "@/modules/tenancy/context";
export async function changeAppointment(
  slug: string,
  values: { id: string; version: number; action: string; start?: string },
): Promise<{ ok: boolean; message: string }> {
  const { db, tenant } = await requireMemberManager(slug);
  const parsed = z
    .object({
      id: z.uuid(),
      version: z.number().int().positive(),
      action: z.enum(["cancel", "reschedule", "complete", "no_show"]),
      start: z.iso.datetime({ offset: true }).optional(),
    })
    .safeParse(values);
  if (!parsed.success)
    return { ok: false, message: "Check the appointment details." };
  const v = parsed.data;
  const { error } = await db.rpc("owner_booking_change", {
    p_tenant: tenant.id,
    p_id: v.id,
    p_version: v.version,
    p_action: v.action,
    p_start: v.start,
  });
  if (error)
    return {
      ok: false,
      message:
        error.code === "P0001"
          ? error.message
          : "You cannot change this appointment.",
    };
  revalidatePath(`/workspace/${slug}/calendar`);
  revalidatePath(`/workspace/${slug}/customers`);
  const { data: appointment } = await db
    .from("appointments")
    .select("customer_id")
    .eq("tenant_id", tenant.id)
    .eq("id", v.id)
    .maybeSingle();
  if (appointment)
    revalidatePath(`/workspace/${slug}/customers/${appointment.customer_id}`);
  return { ok: true, message: "Appointment updated." };
}
