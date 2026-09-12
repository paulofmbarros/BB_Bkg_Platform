"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireManager } from "@/modules/tenancy/context";
import { customerEditSchema } from "./model";
export async function editCustomer(
  slug: string,
  id: string,
  _previous: { ok: boolean; message: string },
  form: FormData,
) {
  const { db, tenant } = await requireManager(slug);
  const parsed = customerEditSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success || !z.uuid().safeParse(id).success)
    return { ok: false, message: "Enter a name and valid email address." };
  const { error } = await db.rpc("update_customer", {
    p_tenant: tenant.id,
    p_id: id,
    p_version: parsed.data.version,
    p_name: parsed.data.name,
    p_email: parsed.data.email,
  });
  if (error)
    return {
      ok: false,
      message:
        error.code === "P0001"
          ? error.message
          : "This profile could not be updated.",
    };
  revalidatePath(`/workspace/${slug}/customers`);
  revalidatePath(`/workspace/${slug}/customers/${id}`);
  revalidatePath(`/workspace/${slug}/calendar`);
  return { ok: true, message: "Customer details saved." };
}

export async function linkCustomers(
  slug: string,
  source: string,
  target: string,
  _previous: { ok: boolean; message: string },
  form: FormData,
) {
  const { db, tenant } = await requireManager(slug);
  const parsed = z
    .object({
      source_version: z.coerce.number().int().positive(),
      target_version: z.coerce.number().int().positive(),
      source_revision: z.string().regex(/^[a-f0-9]{64}$/),
      target_revision: z.string().regex(/^[a-f0-9]{64}$/),
      confirmation: z.enum(["customer_confirmed", "records_reviewed"]),
      acknowledge: z.literal("on"),
    })
    .safeParse(Object.fromEntries(form));
  if (
    !parsed.success ||
    !z.uuid().safeParse(source).success ||
    !z.uuid().safeParse(target).success
  )
    return {
      ok: false,
      message: "Confirm that both records belong to the same customer.",
    };
  const v = parsed.data;
  const { error } = await db.rpc("link_customers", {
    p_tenant: tenant.id,
    p_source: source,
    p_target: target,
    p_source_version: v.source_version,
    p_target_version: v.target_version,
    p_source_revision: v.source_revision,
    p_target_revision: v.target_revision,
    p_confirmation: v.confirmation,
  });
  if (error)
    return {
      ok: false,
      message:
        error.code === "P0001"
          ? error.message
          : "These profiles could not be linked.",
    };
  revalidatePath(`/workspace/${slug}/customers`, "layout");
  revalidatePath(`/workspace/${slug}/calendar`);
  return {
    ok: true,
    message:
      "Profiles linked. The retained profile now contains both histories.",
  };
}
export async function undoCustomerLink(slug: string, id: string) {
  const { db, tenant } = await requireManager(slug);
  if (!z.uuid().safeParse(id).success)
    return { ok: false, message: "Invalid customer link." };
  const { error } = await db.rpc("undo_customer_link", {
    p_tenant: tenant.id,
    p_link: id,
  });
  if (error)
    return {
      ok: false,
      message:
        error.code === "P0001"
          ? error.message
          : "This link could not be undone.",
    };
  revalidatePath(`/workspace/${slug}/customers`, "layout");
  revalidatePath(`/workspace/${slug}/calendar`);
  return {
    ok: true,
    message:
      "Link undone. The original records and histories are separate again.",
  };
}
