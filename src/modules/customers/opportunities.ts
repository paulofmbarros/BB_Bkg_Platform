import "server-only";
import { notFound } from "next/navigation";
import type { Business } from "@/modules/businesses/queries";
import { requireTenant } from "@/modules/tenancy/context";
import {
  opportunitySummarySchema,
  rebookingOpportunitySchema,
} from "./opportunity-model";
import {
  outreachActionSchema,
  outreachSummarySchema,
  type OutreachAction,
} from "./outreach-model";

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
  const [result, summary, outreachSummary] = await Promise.all([
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
    context.db.rpc("customer_outreach_summary", {
      p_tenant: context.tenant.id,
    }),
  ]);
  if (result.error || summary.error || outreachSummary.error)
    throw new Error(
      "Could not load rebooking opportunities. Please try again.",
    );
  const opportunities = (result.data ?? []).map((row) =>
    rebookingOpportunitySchema.parse(row),
  );
  const customerIds = opportunities.map((opportunity) => opportunity.id);
  const outreach = customerIds.length
    ? await context.db
        .from("customer_outreach_actions")
        .select("*")
        .eq("tenant_id", context.tenant.id)
        .in("customer_id", customerIds)
        .order("contacted_at", { ascending: false })
    : { data: [], error: null };
  if (outreach.error)
    throw new Error("Could not load rebooking outreach activity.");
  const latestByCustomer = new Map<string, OutreachAction>();
  for (const row of outreach.data ?? [])
    if (!latestByCustomer.has(row.customer_id))
      latestByCustomer.set(row.customer_id, outreachActionSchema.parse(row));
  return {
    ...context,
    total: result.count ?? 0,
    summary: opportunitySummarySchema.parse(summary.data),
    outreachSummary: outreachSummarySchema.parse(outreachSummary.data),
    opportunities: opportunities.map((opportunity) => {
      const latestOutreach = latestByCustomer.get(opportunity.id) ?? null;
      return {
        ...opportunity,
        latestOutreach,
        attributable:
          !!latestOutreach &&
          !latestOutreach.attributed_appointment_id &&
          Date.now() - new Date(latestOutreach.contacted_at).getTime() <
            30 * 24 * 60 * 60 * 1000,
      };
    }),
  };
}
