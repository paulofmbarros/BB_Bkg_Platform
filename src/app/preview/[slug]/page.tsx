import { getBusiness } from "@/modules/businesses/queries";
import { ShopPage } from "@/components/shop-page";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const b = await getBusiness((await params).slug);
  return { title: { absolute: `${b.tenant.name} · Preview` } };
}
export default async function Preview({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const b = await getBusiness(slug);
  return (
    <ShopPage
      preview
      shop={{
        booking_enabled: false,
        name: b.tenant.name,
        slug: b.tenant.slug,
        is_demo: b.tenant.is_demo,
        currency: b.tenant.currency,
        ...b.branding,
        address: b.location.address,
        phone: b.location.phone,
        timezone: b.location.timezone,
        services: b.services.filter((s) => s.active),
        staff: b.staff
          .filter((s) => s.active)
          .map((s) => ({
            ...s,
            service_ids: b.assignments
              .filter((a) => a.staff_id === s.id)
              .map((a) => a.service_id),
          })),
        hours: b.hours,
      }}
    />
  );
}
