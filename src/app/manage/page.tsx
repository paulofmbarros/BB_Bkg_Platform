import Link from "next/link";
import { ManageBooking } from "@/components/manage-booking";
import { bookingShop } from "@/modules/bookings/public-context";
import { contrastText } from "@/lib/format";
import type { CSSProperties } from "react";
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
    <main
      className="booking-page"
      style={
        {
          "--shop-accent": shop.accent_color,
          "--shop-on-accent": contrastText(shop.accent_color),
        } as CSSProperties
      }
    >
      <Link className="booking-brand" href="/">
        {shop.name}
      </Link>
      <h1>Your appointment.</h1>
      <ManageBooking />
    </main>
  );
}
