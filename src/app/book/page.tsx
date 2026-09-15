import Link from "next/link";
import { BookingForm } from "@/components/booking-form";
import { bookingShop } from "@/modules/bookings/public-context";
import { shopTheme } from "@/lib/format";
export async function generateMetadata() {
  const shop = await bookingShop();
  return {
    title: { absolute: `Book a visit · ${shop.name}` },
    robots: { index: false, follow: false },
  };
}
export default async function Book({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const shop = await bookingShop();
  return (
    <main className="booking-page" style={shopTheme(shop.accent_color)}>
      <Link className="booking-brand" href="/">
        {shop.name}
      </Link>
      <span className="eyebrow">A LITTLE TIME, WELL SPENT</span>
      <h1>Book your next visit.</h1>
      <p>Your service. Your barber. A time that suits you.</p>
      <BookingForm shop={shop} initialService={(await searchParams).service} />
    </main>
  );
}
