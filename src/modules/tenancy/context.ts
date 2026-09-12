import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";

export const requireTenant = cache(async (slug: string) => {
  const db = await createSessionClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");
  const { data: tenant, error } = await db
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .single();
  if (error || !tenant) notFound();
  const { data: membership } = await db
    .from("tenant_memberships")
    .select("role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .eq("active", true)
    .single();
  if (!membership) notFound();
  return { db, tenant, user, role: membership.role };
});

export async function requireManager(slug: string) {
  const context = await requireTenant(slug);
  if (context.role !== "owner" && context.role !== "manager")
    throw new Error("You do not have permission to make this change.");
  const { data } = await context.db
    .from("feature_entitlements")
    .select("enabled")
    .eq("tenant_id", context.tenant.id)
    .eq("feature", "foundation")
    .single();
  if (!data?.enabled)
    throw new Error("Business management is not enabled for this account.");
  return context;
}
