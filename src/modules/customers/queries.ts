import "server-only";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { requireTenant } from "@/modules/tenancy/context";
import {
  customerSummarySchema,
  historyFilter,
  literalSearch,
  pageNumber,
  scalar,
  type QueryValues,
} from "./model";
import { segments, segmentFields } from "./segments";
export const PAGE_SIZE = 20;
export async function getCustomers(slug: string, search: QueryValues) {
  const context = await requireTenant(slug);
  const q = scalar(search.q).trim().slice(0, 100),
    page = pageNumber(search.page);
  const segment =
    context.role !== "staff"
      ? segments.find((s) => s === search.segment)
      : undefined;
  let query =
    context.role === "staff"
      ? context.db
          .from("customer_summaries")
          .select("*", { count: "exact" })
          .eq("tenant_id", context.tenant.id)
      : context.db
          .from("customer_segments")
          .select("*", { count: "exact" })
          .eq("tenant_id", context.tenant.id)
          .in("segment", segment ? [segment] : [...segments]);
  if (q) query = query.ilike("search_text", `%${literalSearch(q)}%`);
  const { data, error, count } = await query
    .order("display_name")
    .order("id")
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (error?.code === "PGRST103")
    redirect(
      `/workspace/${slug}/customers?${new URLSearchParams({ q, ...(segment ? { segment } : {}) })}`,
    );
  if (error)
    throw new Error("Could not load your customers. Please try again.");
  const counts =
    context.role !== "staff"
      ? await context.db.rpc("customer_segment_counts", {
          p_tenant: context.tenant.id,
          p_query: q,
        })
      : { data: [], error: null };
  if (counts.error) throw new Error("Could not load customer segments.");
  return {
    ...context,
    segment,
    counts: z
      .array(z.object({ segment: z.enum(segments), count: z.number() }))
      .parse(counts.data),
    q,
    page,
    total: count ?? 0,
    customers: (data ?? []).map((row) => ({
      ...customerSummarySchema.parse(row),
      ...(context.role !== "staff" ? segmentFields.parse(row) : {}),
    })),
  };
}
export async function getCustomer(
  slug: string,
  id: string,
  search: QueryValues,
) {
  const context = await requireTenant(slug);
  if (!z.uuid().safeParse(id).success) notFound();
  const { data, error } = await context.db
    .from("customer_summaries")
    .select("*")
    .eq("tenant_id", context.tenant.id)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Could not load this customer.");
  if (!data) {
    const { data: linked } = await context.db
      .from("customers")
      .select("linked_customer_id")
      .eq("tenant_id", context.tenant.id)
      .eq("id", id)
      .maybeSingle();
    if (linked?.linked_customer_id)
      redirect(`/workspace/${slug}/customers/${linked.linked_customer_id}`);
    notFound();
  }
  const segmentation =
    context.role !== "staff"
      ? await context.db
          .from("customer_segments")
          .select("segment,days_since_visit,duplicate_records")
          .eq("tenant_id", context.tenant.id)
          .eq("id", id)
          .single()
      : null;
  if (segmentation?.error)
    throw new Error("Could not load the customer segment.");
  const customer = customerSummarySchema.parse(data),
    page = pageNumber(search.page),
    filter = historyFilter(search.filter);
  let query = context.db
    .from("appointments")
    .select(
      "id,starts_at,ends_at,service_name,price_minor,status,staff_members(display_name)",
      { count: "exact" },
    )
    .eq("tenant_id", context.tenant.id)
    .eq("customer_id", id);
  if (filter === "upcoming")
    query = query
      .eq("status", "confirmed")
      .gt("starts_at", new Date().toISOString());
  else if (filter !== "all") query = query.eq("status", filter);
  const [history, duplicates, links] = await Promise.all([
    query
      .order("starts_at", { ascending: false })
      .order("id")
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    context.db
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", context.tenant.id)
      .eq("email", customer.email)
      .neq("id", id)
      .is("linked_customer_id", null),
    context.db
      .from("customer_links")
      .select("id,source_id,confirmation,created_at")
      .eq("tenant_id", context.tenant.id)
      .eq("target_id", id)
      .is("undone_at", null)
      .order("created_at", { ascending: false }),
  ]);
  if (history.error?.code === "PGRST103")
    redirect(`/workspace/${slug}/customers/${id}?filter=${filter}`);
  if (history.error || duplicates.error || links.error)
    throw new Error("Could not load customer history.");
  const sourceIds = (links.data ?? []).map((l) => l.source_id);
  const sources = sourceIds.length
    ? await context.db
        .from("customers")
        .select("id,display_name,email")
        .eq("tenant_id", context.tenant.id)
        .in("id", sourceIds)
    : { data: [], error: null };
  if (sources.error) throw new Error("Could not load linked records.");
  return {
    ...context,
    links: (links.data ?? []).map((l) => ({
      ...l,
      source: sources.data?.find((s) => s.id === l.source_id),
    })),
    segmentation: segmentation ? segmentFields.parse(segmentation.data) : null,
    customer,
    page,
    filter,
    appointments: history.data ?? [],
    total: history.count ?? 0,
    duplicates: duplicates.count ?? 0,
  };
}
