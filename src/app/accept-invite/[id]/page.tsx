import Link from "next/link";
import { z } from "zod";
import { notFound } from "next/navigation";
import { AcceptInvitation } from "@/components/accept-invitation";
export const metadata = {
  title: "Your barbershop invitation",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
export default async function InvitationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  return (
    <main className="standalone auth-card">
      <span className="eyebrow">WELCOME TO BARBERSHOP OS</span>
      <h1>Your workspace is waiting.</h1>
      <p>
        Accept your invitation to manage your barbershop. You can then choose a
        password and set up your services, team and hours.
      </p>
      <AcceptInvitation id={id} />
      <Link className="text-link" href="/login">
        Already accepted? Sign in
      </Link>
    </main>
  );
}
