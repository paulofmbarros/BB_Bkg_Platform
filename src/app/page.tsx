import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";
import Link from "next/link";
import { headers } from "next/headers";
import { isWorkspaceHost } from "@/modules/tenancy/host";
import { getPublicShop } from "@/modules/businesses/public-query";
import { ShopPage } from "@/components/shop-page";
async function customerHost() {
  const host = (await headers()).get("x-shop-host") ?? "";
  return host &&
    !isWorkspaceHost(host, process.env.APP_ORIGIN ?? "http://127.0.0.1:3000") &&
    !(process.env.NODE_ENV === "development" && host === "localhost")
    ? host
    : null;
}
export async function generateMetadata() {
  const host = await customerHost();
  if (!host) return { title: "Your workspace" };
  const shop = await getPublicShop(host);
  return { title: { absolute: shop.name }, description: shop.description };
}
export default async function Home() {
  const host = await customerHost();
  if (host) return <ShopPage shop={await getPublicShop(host)} />;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL)
    return (
      <main className="standalone">
        <h1>Your workspace is almost ready.</h1>
        <p>
          Start the local database and add the connection details described in
          README.md.
        </p>
      </main>
    );
  const db = await createSessionClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");
  const { data: tenants } = await db
    .from("tenants")
    .select("slug,name")
    .eq("active", true)
    .order("name");
  if (tenants?.length === 1) redirect(`/workspace/${tenants[0].slug}`);
  return (
    <main className="standalone">
      <span className="eyebrow">YOUR WORKSPACE</span>
      <h1>
        {tenants?.length ? "Choose your business" : "No business access yet"}
      </h1>
      {tenants?.length ? (
        tenants.map((t) => (
          <Link
            className="button secondary"
            key={t.slug}
            href={`/workspace/${t.slug}`}
          >
            {t.name}
          </Link>
        ))
      ) : (
        <p>Ask the business owner to arrange access for your account.</p>
      )}
    </main>
  );
}
