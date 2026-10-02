import { getBusiness } from "@/modules/businesses/queries";
import { ShopPage } from "@/components/shop-page";
import { localeOrEnglish } from "@/i18n/locales";
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
        public_locale: localeOrEnglish(b.tenant.public_locale),
        ...b.branding,
        address: b.location.address,
        phone: b.location.phone,
        timezone: b.location.timezone,
        protection_policy: {
          enabled: b.protectionPolicy.enabled,
          deposit_rule: b.protectionPolicy.deposit_rule as
            "none" | "risk_based" | "all",
          deposit_percent: b.protectionPolicy.deposit_percent,
          cancellation_window_hours:
            b.protectionPolicy.cancellation_window_hours,
          reminder_lead_hours: b.protectionPolicy.reminder_lead_hours,
        },
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
