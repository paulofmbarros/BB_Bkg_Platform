import "server-only";

import { notFound } from "next/navigation";
import { requireTenant } from "@/modules/tenancy/context";
import { recoveryOpportunitySchema, recoverySummarySchema } from "./model";

export async function getRevenueRecovery(slug: string) {
  const context = await requireTenant(slug);
  if (context.supportMode || context.role === "staff") notFound();

  const [
    opportunities,
    waitlist,
    customers,
    services,
    staff,
    assignments,
    summary,
  ] = await Promise.all([
    context.db
      .from("revenue_recovery_opportunities")
      .select("*")
      .eq("tenant_id", context.tenant.id)
      .order("starts_at")
      .order("customer_name"),
    context.db
      .from("waitlist_entries")
      .select(
        "*,customer:customers!waitlist_entries_tenant_id_customer_id_fkey(display_name,email),service:services!waitlist_entries_tenant_id_service_id_fkey(name),preferred_staff:staff_members!waitlist_entries_tenant_id_preferred_staff_id_fkey(display_name)",
      )
      .eq("tenant_id", context.tenant.id)
      .eq("status", "waiting")
      .order("created_at"),
    context.db
      .from("customers")
      .select("id,display_name,email,marketing_consent")
      .eq("tenant_id", context.tenant.id)
      .is("linked_customer_id", null)
      .order("display_name")
      .limit(200),
    context.db
      .from("services")
      .select("id,name,price_minor")
      .eq("tenant_id", context.tenant.id)
      .eq("active", true)
      .order("name"),
    context.db
      .from("staff_members")
      .select("id,display_name")
      .eq("tenant_id", context.tenant.id)
      .eq("active", true)
      .order("display_name"),
    context.db
      .from("staff_services")
      .select("staff_id,service_id")
      .eq("tenant_id", context.tenant.id),
    context.db.rpc("revenue_recovery_summary", {
      p_tenant: context.tenant.id,
    }),
  ]);

  for (const result of [
    opportunities,
    waitlist,
    customers,
    services,
    staff,
    assignments,
    summary,
  ]) {
    if (result.error)
      throw new Error("Could not load revenue recovery. Please try again.");
  }

  return {
    ...context,
    opportunities: opportunities.data!.map((row) =>
      recoveryOpportunitySchema.parse(row),
    ),
    waitlist: waitlist.data!.map(({ preferred_staff, ...entry }) => ({
      ...entry,
      preferredStaff: preferred_staff,
    })),
    customers: customers.data!.filter((customer) => customer.marketing_consent),
    services: services.data!,
    staff: staff.data!.map((member) => ({
      ...member,
      serviceIds: assignments
        .data!.filter((assignment) => assignment.staff_id === member.id)
        .map((assignment) => assignment.service_id),
    })),
    summary: recoverySummarySchema.parse(summary.data),
  };
}
