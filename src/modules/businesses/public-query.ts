import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/server";
import { publicShopSchema } from "./public-shop";
export const getPublicShop = cache(async (hostname: string) => {
  const { data, error } = await createPublicClient().rpc("get_public_shop", {
    p_hostname: hostname,
  });
  if (error) throw new Error("Could not load this shop.");
  if (!data) notFound();
  return publicShopSchema.parse(data);
});
