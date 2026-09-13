import "server-only";
import { notFound, redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";
import type { PlatformData } from "./model";

export async function requirePlatformAdmin() {
  const db = await createSessionClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await db.rpc("is_platform_admin");
  if (error || !data) notFound();
  return { db, user };
}
export async function getPlatformClients(id?: string) {
  const { db } = await requirePlatformAdmin();
  const { data, error } = await db.rpc(
    "platform_clients",
    id ? { p_id: id } : {},
  );
  if (error) throw new Error("Could not load clients. Please try again.");
  return data as unknown as PlatformData;
}
