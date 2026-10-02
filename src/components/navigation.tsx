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
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { signOut } from "@/modules/identity/actions";
import { initials } from "@/lib/format";
import { useTranslations } from "@/i18n/provider";

export function Navigation({
  slug,
  name,
  role,
  email,
  supportMode = false,
}: {
  slug: string;
  name: string;
  role: string;
  email: string;
  supportMode?: boolean;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState("");
  const base = `/workspace/${slug}`;
  const links = [
    { path: "", label: t("Overview"), icon: LayoutDashboard },
    { path: "/calendar", label: t("Calendar"), icon: CalendarDays },
    ...(role !== "staff" && !supportMode
      ? [
          {
            path: "/revenue-protection",
            label: t("Revenue protection"),
            icon: ShieldCheck,
          },
          {
            path: "/revenue-recovery",
            label: t("Revenue recovery"),
            icon: RefreshCw,
          },
        ]
      : []),
    { path: "/customers", label: t("Customers"), icon: UsersRound },
    { path: "/services", label: t("Services"), icon: Scissors },
    { path: "/team", label: t("Team"), icon: UsersRound },
    { path: "/hours", label: t("Opening hours"), icon: Clock3 },
    { path: "/settings", label: t("Brand & business"), icon: Palette },
  ].filter(({ path }) => !supportMode || path !== "/customers");
  return (
    <>
      <div className="mobile-top">
        <Link href={base} className="wordmark" prefetch={false}>
          barbershop<span>os</span>
        </Link>
        <button
          className="icon-button"
          onClick={() => setOpen(!open)}
          aria-label={t(open ? "Close menu" : "Open menu")}
          aria-expanded={open}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <button
          className="sidebar-scrim"
          aria-label={t("Close menu")}
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <Link className="wordmark" href={base} prefetch={false}>
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
              {supportMode
                ? t("Platform support")
                : role === "staff"
                  ? t("Team workspace")
                  : t("Business workspace")}
            </span>
          </div>
          <PanelLeftClose size={15} />
        </div>
        <p className="nav-label">{t("YOUR BUSINESS")}</p>
        <nav aria-label="Main navigation">
          {links.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              onClick={() => setOpen(false)}
              onNavigate={() => setPendingPath(`${base}${path}`)}
              href={`${base}${path}`}
              prefetch={false}
              aria-busy={
                pendingPath === `${base}${path}` &&
                pathname !== `${base}${path}`
              }
              aria-current={
                (path ? pathname.startsWith(base + path) : pathname === base)
                  ? "page"
                  : undefined
              }
              className={`nav-link ${(path ? pathname.startsWith(base + path) : pathname === base) ? "active" : ""}`}
            >
              <Icon size={18} />
              {label}
              {pendingPath === `${base}${path}` &&
                pathname !== `${base}${path}` && (
                  <span className="nav-progress" aria-hidden="true" />
                )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="preview-note">
            <span className="eyebrow">MADE TO FEEL LIKE YOU</span>
            <p>{t("Your shop. Your own experience.")}</p>
            <Link href={`/preview/${slug}`} target="_blank" prefetch={false}>
              {t("Preview your page")} <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="user-row">
            <span className="user-avatar">{email[0]?.toUpperCase()}</span>
            <div>
              <strong>
                {supportMode
                  ? "Platform administrator"
                  : role === "owner"
                    ? t("Business owner")
                    : role === "manager"
                      ? t("Manager")
                      : t("Staff member")}
              </strong>
              <span title={email}>{email}</span>
            </div>
            <form action={signOut}>
              <button className="icon-button" aria-label={t("Sign out")}>
                <LogOut size={17} />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
