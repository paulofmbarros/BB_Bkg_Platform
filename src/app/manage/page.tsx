import Link from "next/link";
import { ManageBooking } from "@/components/manage-booking";
import { bookingShop } from "@/modules/bookings/public-context";
import { shopTheme } from "@/lib/format";
import { LocaleProvider } from "@/i18n/provider";
import { localeOrEnglish, translator } from "@/i18n/locales";
export async function generateMetadata() {
  const shop = await bookingShop();
  const t = translator(localeOrEnglish(shop.public_locale));
  return {
    title: { absolute: `${t("Your appointment.")} · ${shop.name}` },
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}
export default async function Manage() {
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
        <h1>{t("Your appointment.")}</h1>
        <ManageBooking />
      </main>
    </LocaleProvider>
  );
}
