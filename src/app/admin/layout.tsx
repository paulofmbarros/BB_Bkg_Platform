import Link from "next/link";
import { Scissors, Store } from "lucide-react";
import { requirePlatformAdmin } from "@/modules/platform/queries";
import { signOut } from "@/modules/identity/actions";
export const metadata = { title: "Platform administration" };
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requirePlatformAdmin();
  return (
    <div className="platform-shell">
      <header className="platform-header">
        <Link href="/admin" className="platform-brand">
          <Scissors size={24} />
          <span>
            Barbershop OS<small>PLATFORM ADMINISTRATION</small>
          </span>
        </Link>
        <div>
          <span className="platform-account">{user.email}</span>
          <form action={signOut}>
            <button className="button secondary">Sign out</button>
          </form>
        </div>
      </header>
      <div className="platform-body">
        <aside className="platform-sidebar">
          <Link href="/admin" aria-current="page">
            <Store size={19} />
            Clients
          </Link>
          <p>Your clients, their access and their setup.</p>
        </aside>
        <main className="platform-main">{children}</main>
      </div>
    </div>
  );
}
