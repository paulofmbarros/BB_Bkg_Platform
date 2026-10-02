import Link from "next/link";
import { BookingForm } from "@/components/booking-form";
import { bookingShop } from "@/modules/bookings/public-context";
import { shopTheme } from "@/lib/format";
import { LocaleProvider } from "@/i18n/provider";
import { localeOrEnglish, translator } from "@/i18n/locales";
export async function generateMetadata() {
  const shop = await bookingShop();
  const t = translator(localeOrEnglish(shop.public_locale));
  return {
    title: { absolute: `${t("Book a visit")} · ${shop.name}` },
    robots: { index: false, follow: false },
  };
}
export default async function Book({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const shop = await bookingShop();
  const locale = localeOrEnglish(shop.public_locale);
  const t = translator(locale);
  return (
    <LocaleProvider locale={locale}>
      <main
        className="booking-page"
        style={shopTheme(shop.accent_color)}
        lang={locale === "pt" ? "pt-PT" : "en"}
      >
        <Link className="booking-brand" href="/">
          {shop.name}
        </Link>
        <span className="eyebrow">{t("A LITTLE TIME, WELL SPENT")}</span>
        <h1>{t("Book your next visit.")}</h1>
        <p>{t("Your service. Your barber. A time that suits you.")}</p>
        <BookingForm
          shop={shop}
          initialService={(await searchParams).service}
        />
      </main>
    </LocaleProvider>
  );
}
