"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Scissors,
  UsersRound,
  Clock3,
  Palette,
  ArrowUpRight,
  Menu,
  X,
  LogOut,
  PanelLeftClose,
} from "lucide-react";
import { signOut } from "@/modules/identity/actions";
import { initials } from "@/lib/format";

export function Navigation({
  slug,
  name,
  role,
  email,
}: {
  slug: string;
  name: string;
  role: string;
  email: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const base = `/workspace/${slug}`;
  const links = [
    { path: "", label: "Overview", icon: LayoutDashboard },
    { path: "/calendar", label: "Calendar", icon: CalendarDays },
    { path: "/customers", label: "Customers", icon: UsersRound },
    { path: "/services", label: "Services", icon: Scissors },
    { path: "/team", label: "Team", icon: UsersRound },
    { path: "/hours", label: "Opening hours", icon: Clock3 },
    { path: "/settings", label: "Brand & business", icon: Palette },
  ];
  return (
    <>
      <div className="mobile-top">
        <Link href={base} className="wordmark">
          barbershop<span>os</span>
        </Link>
        <button
          className="icon-button"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <button
          className="sidebar-scrim"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <Link className="wordmark" href={base}>
          barbershop<span>os</span>
          <span className="wordmark-symbol">
            <Scissors size={19} />
          </span>
        </Link>
        <div className="business-switch">
          <div className="shop-monogram">{initials(name)}</div>
          <div>
            <strong>{name}</strong>
            <span>
              {role === "staff" ? "Team workspace" : "Business workspace"}
            </span>
          </div>
          <PanelLeftClose size={15} />
        </div>
        <p className="nav-label">YOUR BUSINESS</p>
        <nav aria-label="Main navigation">
          {links.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              onClick={() => setOpen(false)}
              href={`${base}${path}`}
              aria-current={
                (path ? pathname.startsWith(base + path) : pathname === base)
                  ? "page"
                  : undefined
              }
              className={`nav-link ${(path ? pathname.startsWith(base + path) : pathname === base) ? "active" : ""}`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="preview-note">
            <span className="eyebrow">MADE TO FEEL LIKE YOU</span>
            <p>
              Your shop.
              <br />
              Your own experience.
            </p>
            <Link href={`/preview/${slug}`} target="_blank">
              Preview your page <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="user-row">
            <span className="user-avatar">{email[0]?.toUpperCase()}</span>
            <div>
              <strong>
                {role === "owner"
                  ? "Business owner"
                  : role === "manager"
                    ? "Manager"
                    : "Staff member"}
              </strong>
              <span title={email}>{email}</span>
            </div>
            <form action={signOut}>
              <button className="icon-button" aria-label="Sign out">
                <LogOut size={17} />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
