"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireManager } from "@/modules/tenancy/context";
import {
  serviceSchema,
  staffSchema,
  brandingSchema,
  hoursSchema,
  exceptionSchema,
  priceToMinorUnits,
} from "./validation";

export type ActionResult = { ok: boolean; message: string; id?: string };
const uuid = z.string().uuid();
function failure(error: unknown): ActionResult {
  if (error instanceof z.ZodError)
    return {
      ok: false,
      message: error.issues[0]?.message ?? "Check your entries.",
    };
  console.error(
    JSON.stringify({
      event: "business_mutation_failed",
      message:
        error instanceof Error ? error.message : "Database operation rejected",
    }),
  );
  return {
    ok: false,
    message:
      "The change could not be saved. Check your permissions and try again.",
  };
}
function refreshed(slug: string, message = "Changes saved."): ActionResult {
  revalidatePath(`/workspace/${slug}`, "layout");
  revalidatePath(`/preview/${slug}`);
  return { ok: true, message };
}

export async function saveService(
  slug: string,
  id: string | null,
  _previous: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const { db, tenant } = await requireManager(slug);
  try {
    const input = serviceSchema.parse({
      ...Object.fromEntries(form),
      active: form.get("active") === "on",
    });
    const { price, ...rest } = input;
    const row = { ...rest, price_minor: priceToMinorUnits(price) };
    const result = id
      ? await db
          .from("services")
          .update(row)
          .eq("id", uuid.parse(id))
          .eq("tenant_id", tenant.id)
          .select("id")
          .single()
      : await db
          .from("services")
          .insert({ ...row, tenant_id: tenant.id })
          .select("id")
          .single();
    if (result.error) throw result.error;
    return {
      ...refreshed(slug, id ? "Service updated." : "Service added."),
      id: result.data.id,
    };
  } catch (error) {
    return failure(error);
  }
}

export async function setServiceArchived(
  slug: string,
  id: string,
  archived: boolean,
): Promise<ActionResult> {
  const { db, tenant } = await requireManager(slug);
  try {
    const { error } = await db
      .from("services")
      .update({ active: !archived })
      .eq("id", uuid.parse(id))
      .eq("tenant_id", tenant.id)
      .select("id")
      .single();
    if (error) throw error;
    return refreshed(
      slug,
      archived
        ? "Service archived. Existing appointments and reporting were preserved."
        : "Service restored to the customer menu.",
    );
  } catch (error) {
    return failure(error);
  }
}

export async function saveStaff(
  slug: string,
  id: string | null,
  _previous: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const { db, tenant } = await requireManager(slug);
  try {
    const input = staffSchema.parse({
      ...Object.fromEntries(form),
      active: form.get("active") === "on",
      service_ids: form.getAll("service_ids"),
    });
    const result = await db.rpc("save_staff", {
      p_tenant: tenant.id,
      p_id: id ? uuid.parse(id) : (null as unknown as string),
      p_name: input.display_name,
      p_title: input.title,
      p_bio: input.bio,
      p_active: input.active,
      p_services: input.service_ids,
    });
    if (result.error) throw result.error;
    return {
      ...refreshed(slug, id ? "Team member updated." : "Team member added."),
      id: result.data,
    };
  } catch (error) {
    return failure(error);
  }
}

export async function saveHours(
  slug: string,
  subject: string,
  staff: boolean,
  rows: unknown,
): Promise<ActionResult> {
  const { db, tenant } = await requireManager(slug);
  try {
    const input = hoursSchema.parse(rows);
    const { error } = await db.rpc("save_hours", {
      p_tenant: tenant.id,
      p_subject: uuid.parse(subject),
      p_staff: staff,
      p_rows: input,
    });
    if (error) throw error;
    return refreshed(slug, "Working hours saved.");
  } catch (error) {
    return failure(error);
  }
}

export async function saveBranding(
  slug: string,
  _previous: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const { db, tenant, role } = await requireManager(slug);
  if (role !== "owner")
    return {
      ok: false,
      message: "Only the owner can change business branding.",
    };
  try {
    const input = brandingSchema.parse(Object.fromEntries(form));
    const { error } = await db.rpc("save_branding", {
      p_tenant: tenant.id,
      p_name: input.name,
      p_tagline: input.tagline,
      p_description: input.description,
      p_accent: input.accent_color,
      p_address: input.address,
      p_phone: input.phone,
    });
    if (error) throw error;
    return refreshed(slug, "Your business details are saved.");
  } catch (error) {
    return failure(error);
  }
}

export async function uploadLogo(
  slug: string,
  _previous: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const { db, tenant, role } = await requireManager(slug);
  if (role !== "owner")
    return { ok: false, message: "Only the owner can change the logo." };
  try {
    const file = form.get("logo");
    if (
      !(file instanceof File) ||
      file.size === 0 ||
      file.size > 2 * 1024 * 1024
    )
      return {
        ok: false,
        message: "Choose a PNG, JPEG or WebP image under 2 MB.",
      };
    const bytes = new Uint8Array(await file.arrayBuffer());
    const png = [137, 80, 78, 71, 13, 10, 26, 10].every(
      (v, i) => bytes[i] === v,
    );
    const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp =
      new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
      new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
    const ext = png ? "png" : jpg ? "jpg" : webp ? "webp" : null;
    if (!ext)
      return { ok: false, message: "That file is not a supported image." };
    const path = `${tenant.id}/${crypto.randomUUID()}.${ext}`;
    const { data: previous } = await db
      .from("tenant_branding")
      .select("logo_path")
      .eq("tenant_id", tenant.id)
      .single();
    const { error: uploadError } = await db.storage
      .from("brand-assets")
      .upload(path, bytes, {
        contentType: ext === "jpg" ? "image/jpeg" : `image/${ext}`,
        upsert: false,
      });
    if (uploadError) throw uploadError;
    const { error } = await db
      .from("tenant_branding")
      .update({ logo_path: path })
      .eq("tenant_id", tenant.id)
      .select("tenant_id")
      .single();
    if (error) {
      await db.storage.from("brand-assets").remove([path]);
      throw error;
    }
    if (previous?.logo_path)
      await db.storage.from("brand-assets").remove([previous.logo_path]);
    return refreshed(slug, "Logo updated.");
  } catch (error) {
    return failure(error);
  }
}

export async function addException(
  slug: string,
  staffId: string | null,
  _previous: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const { db, tenant } = await requireManager(slug);
  try {
    const input = exceptionSchema.parse(Object.fromEntries(form));
    const { data: location } = await db
      .from("locations")
      .select("id")
      .eq("tenant_id", tenant.id)
      .single();
    if (!location) throw new Error("Location unavailable");
    const { error } = await db.from("availability_exceptions").insert({
      ...input,
      tenant_id: tenant.id,
      location_id: location.id,
      staff_id: staffId ? uuid.parse(staffId) : null,
    });
    if (error) throw error;
    return refreshed(slug, staffId ? "Time off added." : "Closure added.");
  } catch (error) {
    return failure(error);
  }
}
export async function removeException(
  slug: string,
  id: string,
): Promise<ActionResult> {
  const { db, tenant } = await requireManager(slug);
  try {
    const { error } = await db
      .from("availability_exceptions")
      .delete()
      .eq("tenant_id", tenant.id)
      .eq("id", uuid.parse(id))
      .select("id")
      .single();
    if (error) throw error;
    return refreshed(slug, "Exception removed.");
  } catch (error) {
    return failure(error);
  }
}
