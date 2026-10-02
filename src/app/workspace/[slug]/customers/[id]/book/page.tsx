import { WorkspaceLink as Link } from "@/components/workspace-link";
import { notFound } from "next/navigation";
import { getCustomer } from "@/modules/customers/queries";
import { getBusiness } from "@/modules/businesses/queries";
import { CustomerRebooking } from "@/components/customer-rebooking";
import { getBookingOutreach } from "@/modules/customers/outreach";
import { customerDate } from "@/modules/customers/format";
export default async function Rebook({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<{ outreach?: string | string[] }>;
}) {
  const { slug, id } = await params,
    c = await getCustomer(slug, id, {}),
    outreachValue = (await searchParams).outreach,
    outreachId = typeof outreachValue === "string" ? outreachValue : undefined;
  if (c.role === "staff") notFound();
  const outreach = outreachId
    ? await getBookingOutreach(slug, id, outreachId)
    : null;
  const b = await getBusiness(slug);
  const { data: previous, error } = await b.db
    .from("appointments")
    .select("service_id,staff_id")
    .eq("tenant_id", b.tenant.id)
    .eq("customer_id", id)
    .eq("status", "completed")
    .order("starts_at", { ascending: false })
    .order("id")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("Could not load the previous visit.");
  return (
    <>
      <Link className="text-link" href={`/workspace/${slug}/customers/${id}`}>
        Back to customer profile
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">KEEP A GOOD THING GOING</span>
          <h1>Book the next visit.</h1>
          <p>A new appointment, in the same customer history.</p>
        </div>
      </div>
      {c.customer.upcoming_visits > 0 && (
        <p className="notice">
          This customer already has {c.customer.upcoming_visits} upcoming{" "}
          {c.customer.upcoming_visits === 1 ? "appointment" : "appointments"}.{" "}
          <Link href={`/workspace/${slug}/customers/${id}?filter=upcoming`}>
            Review upcoming visits
          </Link>{" "}
          before adding another.
        </p>
      )}
      {outreach && (
        <p className="notice success">
          This booking will be attributed to the rebooking email recorded on{" "}
          {customerDate(outreach.contacted_at)}. Attribution records influence,
          not payment or recovered revenue.
        </p>
      )}
      <div className="customer-rebooking">
        <CustomerRebooking
          slug={slug}
          customer={{
            id: c.customer.id,
            version: c.customer.version,
            display_name: c.customer.display_name,
            email: c.customer.email,
          }}
          options={{
            services: b.services
              .filter((s) => s.active)
              .map((s) => ({
                id: s.id,
                name: s.name,
                price_minor: s.price_minor,
                duration_minutes: s.duration_minutes,
              })),
            staff: b.staff
              .filter((s) => s.active)
              .map((s) => ({
                id: s.id,
                display_name: s.display_name,
                service_ids: b.assignments
                  .filter((a) => a.staff_id === s.id)
                  .map((a) => a.service_id),
              })),
            previousService: previous?.service_id,
            previousStaff: previous?.staff_id,
          }}
          outreachId={outreach?.id}
        />
      </div>
    </>
  );
}
