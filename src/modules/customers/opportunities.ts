import "server-only";
import { notFound } from "next/navigation";
import type { Business } from "@/modules/businesses/queries";
import { requireTenant } from "@/modules/tenancy/context";
import {
  opportunitySummarySchema,
  rebookingOpportunitySchema,
} from "./opportunity-model";

export async function getRebookingOpportunitySummary(business: Business) {
  if (business.supportMode || business.role === "staff")
    return { count: 0, potential_value_minor: 0 };
  const result = await business.db.rpc(
    "customer_rebooking_opportunity_summary",
    { p_tenant: business.tenant.id },
  );
  if (result.error)
    throw new Error("Could not load the rebooking opportunity summary.");
  return opportunitySummarySchema.parse(result.data);
}

export async function getRebookingOpportunities(slug: string) {
  const context = await requireTenant(slug);
  if (context.supportMode || context.role === "staff") notFound();
  const [result, summary] = await Promise.all([
    context.db
      .from("customer_rebooking_opportunities")
      .select("*", { count: "exact" })
      .eq("tenant_id", context.tenant.id)
      .order("due_in_days")
      .order("display_name")
      .limit(100),
    context.db.rpc("customer_rebooking_opportunity_summary", {
      p_tenant: context.tenant.id,
    }),
  ]);
  if (result.error || summary.error)
    throw new Error(
      "Could not load rebooking opportunities. Please try again.",
    );
  return {
    ...context,
    total: result.count ?? 0,
    summary: opportunitySummarySchema.parse(summary.data),
    opportunities: (result.data ?? []).map((row) =>
      rebookingOpportunitySchema.parse(row),
    ),
  };
}
