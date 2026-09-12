import "server-only";
import { headers } from "next/headers";
import { getPublicShop } from "@/modules/businesses/public-query";
import { notFound } from "next/navigation";
export async function bookingShop() {
  const host = (await headers()).get("x-shop-host") ?? "";
  const shop = await getPublicShop(host);
  if (!shop.booking_enabled) notFound();
  return shop;
}
export function publicShopUrl(host: string) {
  const local = host.endsWith(".localhost");
  const port = new URL(process.env.APP_ORIGIN ?? "http://127.0.0.1:3000").port;
  return `${local ? "http" : "https"}://${host}${local && port ? `:${port}` : ""}`;
}
