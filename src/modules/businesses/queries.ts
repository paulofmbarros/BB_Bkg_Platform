import "server-only";
import { cache } from "react";
import { requireTenant } from "@/modules/tenancy/context";

export const getBusiness = cache(async (slug: string) => {
  const context = await requireTenant(slug);
  const { db, tenant } = context;
  const [
    branding,
    location,
    services,
    staff,
    hours,
    assignments,
    staffHours,
    exceptions,
    domains,
  ] = await Promise.all([
    db.from("tenant_branding").select("*").eq("tenant_id", tenant.id).single(),
    db.from("locations").select("*").eq("tenant_id", tenant.id).single(),
    db
      .from("services")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("price_minor"),
    db
      .from("staff_members")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("created_at")
      .order("display_name"),
    db.from("business_hours").select("*").eq("tenant_id", tenant.id),
    db.from("staff_services").select("*").eq("tenant_id", tenant.id),
    db.from("staff_working_hours").select("*").eq("tenant_id", tenant.id),
    db
      .from("availability_exceptions")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("start_date"),
    db.from("tenant_domains").select("*").eq("tenant_id", tenant.id),
  ]);
  for (const result of [
    branding,
    location,
    services,
    staff,
    hours,
    assignments,
    staffHours,
    exceptions,
    domains,
  ]) {
    if (result.error)
      throw new Error("Could not load your business. Please try again.");
  }
  return {
    ...context,
    branding: branding.data!,
    location: location.data!,
    services: services.data!,
    staff: staff.data!,
    hours: hours.data!,
    assignments: assignments.data!,
    staffHours: staffHours.data!,
    exceptions: exceptions.data!,
    domains: domains.data!,
  };
});
export type Business = Awaited<ReturnType<typeof getBusiness>>;
