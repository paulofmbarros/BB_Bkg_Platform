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
    entitlements,
    protectionPolicy,
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
    db.from("feature_entitlements").select("*").eq("tenant_id", tenant.id),
    db
      .from("revenue_protection_policies")
      .select("*")
      .eq("tenant_id", tenant.id)
      .single(),
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
    entitlements,
    protectionPolicy,
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
    entitlements: entitlements.data!,
    protectionPolicy: protectionPolicy.data!,
  };
});
export type Business = Awaited<ReturnType<typeof getBusiness>>;

export const getServiceBusiness = cache(async (slug: string) => {
  const context = await requireTenant(slug);
  const services = await context.db
    .from("services")
    .select("*")
    .eq("tenant_id", context.tenant.id)
    .order("price_minor");
  if (services.error)
    throw new Error("Could not load your services. Please try again.");
  return { ...context, services: services.data };
});

export const getTeamBusiness = cache(async (slug: string) => {
  const context = await requireTenant(slug);
  const { db, tenant } = context;
  const [services, staff, assignments, staffHours] = await Promise.all([
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
    db.from("staff_services").select("*").eq("tenant_id", tenant.id),
    db.from("staff_working_hours").select("*").eq("tenant_id", tenant.id),
  ]);
  if (services.error || staff.error || assignments.error || staffHours.error)
    throw new Error("Could not load your team. Please try again.");
  return {
    ...context,
    services: services.data,
    staff: staff.data,
    assignments: assignments.data,
    staffHours: staffHours.data,
  };
});

export const getStaffBusiness = cache(async (slug: string) => {
  const business = await getTeamBusiness(slug);
  const exceptions = await business.db
    .from("availability_exceptions")
    .select("*")
    .eq("tenant_id", business.tenant.id)
    .order("start_date");
  if (exceptions.error)
    throw new Error("Could not load team availability. Please try again.");
  return { ...business, exceptions: exceptions.data };
});

export const getHoursBusiness = cache(async (slug: string) => {
  const context = await requireTenant(slug);
  const { db, tenant } = context;
  const [location, hours, exceptions] = await Promise.all([
    db.from("locations").select("*").eq("tenant_id", tenant.id).single(),
    db.from("business_hours").select("*").eq("tenant_id", tenant.id),
    db
      .from("availability_exceptions")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("start_date"),
  ]);
  if (location.error || hours.error || exceptions.error)
    throw new Error("Could not load opening hours. Please try again.");
  return {
    ...context,
    location: location.data,
    hours: hours.data,
    exceptions: exceptions.data,
  };
});

export const getSettingsBusiness = cache(async (slug: string) => {
  const context = await requireTenant(slug);
  const { db, tenant } = context;
  const [branding, location, domains] = await Promise.all([
    db.from("tenant_branding").select("*").eq("tenant_id", tenant.id).single(),
    db.from("locations").select("*").eq("tenant_id", tenant.id).single(),
    db.from("tenant_domains").select("*").eq("tenant_id", tenant.id),
  ]);
  if (branding.error || location.error || domains.error)
    throw new Error("Could not load business settings. Please try again.");
  return {
    ...context,
    branding: branding.data,
    location: location.data,
    domains: domains.data,
  };
});

export const getCalendarBusiness = cache(async (slug: string) => {
  const context = await requireTenant(slug);
  const { db, tenant } = context;
  const [staff, domains] = await Promise.all([
    db
      .from("staff_members")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("created_at")
      .order("display_name"),
    db.from("tenant_domains").select("*").eq("tenant_id", tenant.id),
  ]);
  if (staff.error || domains.error)
    throw new Error("Could not load your calendar. Please try again.");
  return { ...context, staff: staff.data, domains: domains.data };
});
