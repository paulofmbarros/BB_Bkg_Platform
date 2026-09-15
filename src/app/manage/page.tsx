import Link from "next/link";
import { ManageBooking } from "@/components/manage-booking";
import { bookingShop } from "@/modules/bookings/public-context";
import { shopTheme } from "@/lib/format";
export async function generateMetadata() {
  const shop = await bookingShop();
  return {
    title: { absolute: `Your appointment · ${shop.name}` },
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}
export default async function Manage() {
  const shop = await bookingShop();
  return (
    <main className="booking-page" style={shopTheme(shop.accent_color)}>
      <Link className="booking-brand" href="/">
        {shop.name}
      </Link>
      <h1>Your appointment.</h1>
      <ManageBooking />
    </main>
  );
}
