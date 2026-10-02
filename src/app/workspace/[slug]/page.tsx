import { WorkspaceLink as Link } from "@/components/workspace-link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Scissors,
  UsersRound,
  Clock3,
  Palette,
  CheckCircle2,
  CalendarDays,
  CircleCheck,
  LifeBuoy,
  TriangleAlert,
  ClipboardCheck,
  BadgeEuro,
  RefreshCcw,
} from "lucide-react";
import { getBusiness } from "@/modules/businesses/queries";
import { getBusinessBrief } from "@/modules/businesses/brief";
import { getRebookingOpportunitySummary } from "@/modules/customers/opportunities";
import { appointmentDate, slotLabel } from "@/modules/bookings/types";
import { weeklyHours, trimHours, weekdays } from "@/modules/scheduling/hours";
import { money, initials } from "@/lib/format";
import { localeOrEnglish, translator, weekdayNames } from "@/i18n/locales";

export default async function Overview({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const b = await getBusiness(slug);
  const [brief, rebooking] = await Promise.all([
    getBusinessBrief(b),
    getRebookingOpportunitySummary(b),
  ]);
  const locale = b.supportMode
    ? "en"
    : localeOrEnglish(b.tenant.workspace_locale);
  const t = translator(locale);
  const activeServices = b.services.filter((s) => s.active);
  const activeStaff = b.staff.filter((s) => s.active);
  const hours = weeklyHours(b.hours);
  const setup = [
    {
      label: t("Make it your own"),
      detail: t("Business name, brand and contact details"),
      done: !!b.branding.tagline && !!b.location.address,
      path: "/settings",
      icon: Palette,
    },
    {
      label: t("Build your service menu"),
      detail:
        locale === "pt"
          ? `${activeServices.length} serviços prontos a descobrir`
          : `${activeServices.length} services ready to discover`,
      done: activeServices.length > 0,
      path: "/services",
      icon: Scissors,
    },
    {
      label: t("Bring your team together"),
      detail:
        locale === "pt"
          ? `${activeStaff.length} barbeiros na sua equipa`
          : `${activeStaff.length} barbers on your team`,
      done: activeStaff.length > 0,
      path: "/team",
      icon: UsersRound,
    },
    {
      label: t("Set your working week"),
      detail:
        locale === "pt"
          ? `${hours} horas de abertura por semana`
          : `${hours} hours open each week`,
      done: hours > 0,
      path: "/hours",
      icon: Clock3,
    },
  ];
  const completed = setup.filter((s) => s.done).length;
  const activeAssignments = b.assignments.filter((assignment) =>
    activeStaff.some((staff) => staff.id === assignment.staff_id),
  ).length;
  const supportChecks = [
    {
      label: "Services available",
      detail: `${activeServices.length} active service${activeServices.length === 1 ? "" : "s"}`,
      ready: activeServices.length > 0,
      path: "/services",
    },
    {
      label: "Barbers assigned to services",
      detail: `${activeAssignments} active assignment${activeAssignments === 1 ? "" : "s"}`,
      ready: activeAssignments > 0,
      path: "/team",
    },
    {
      label: "Opening hours configured",
      detail: `${hours} hours open each week`,
      ready: hours > 0 && b.staffHours.some((row) => row.enabled),
      path: "/hours",
    },
    {
      label: "Customer booking address",
      detail: b.domains.some((domain) => domain.verified_at)
        ? "Verified and ready"
        : "No verified address",
      ready: b.domains.some((domain) => domain.verified_at),
      path: "",
    },
    {
      label: "Online booking",
      detail: b.entitlements.some(
        (entitlement) =>
          entitlement.feature === "booking" && entitlement.enabled,
      )
        ? "Enabled"
        : "Disabled by platform settings",
      ready: b.entitlements.some(
        (entitlement) =>
          entitlement.feature === "booking" && entitlement.enabled,
      ),
      path: "",
    },
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t("THE BIG PICTURE")}</span>
          <h1>
            {t("A good day starts here")}
            <span className="accent-period">.</span>
          </h1>
          <p>
            {locale === "pt"
              ? `Vamos preparar ${b.tenant.name} para o próximo capítulo.`
              : `Let’s get ${b.tenant.name} ready for its next chapter.`}
          </p>
        </div>
        <Link
          className="button secondary"
          href={`/preview/${slug}`}
          target="_blank"
        >
          {t("Preview your shop")} <ArrowUpRight size={16} />
        </Link>
      </div>
      {b.supportMode && (
        <section className="panel support-diagnostics">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">SUPPORT CHECKS</span>
              <h2>Find setup problems quickly</h2>
              <p>
                These checks cover the configuration required for customers to
                find services and available booking times.
              </p>
            </div>
            <LifeBuoy size={24} />
          </div>
          <div className="support-check-list">
            {supportChecks.map((check) => {
              const content = (
                <>
                  {check.ready ? (
                    <CircleCheck size={20} />
                  ) : (
                    <TriangleAlert size={20} />
                  )}
                  <span>
                    <strong>{check.label}</strong>
                    <small>{check.detail}</small>
                  </span>
                  <span
                    className={`support-check-state ${check.ready ? "ready" : "attention"}`}
                  >
                    {check.ready ? "Ready" : "Check"}
                  </span>
                </>
              );
              return check.path ? (
                <Link
                  key={check.label}
                  href={`/workspace/${slug}${check.path}`}
                >
                  {content}
                </Link>
              ) : (
                <div key={check.label}>{content}</div>
              );
            })}
          </div>
          <p className="field-help">
            Booking access and domain verification are controlled from the
            client administration page.
          </p>
        </section>
      )}
      <section
        className="panel daily-brief"
        aria-labelledby="daily-brief-title"
      >
        <div className="panel-heading">
          <div>
            <span className="eyebrow">{t("TODAY AT A GLANCE")}</span>
            <h2 id="daily-brief-title">
              {appointmentDate(`${brief.day}T12:00:00Z`, locale)}
            </h2>
            <p>
              {b.role === "staff" && !b.supportMode
                ? t("A live snapshot of your own schedule.")
                : t("A live operational snapshot for the whole shop.")}
            </p>
          </div>
          <Link href={`/workspace/${slug}/calendar`} className="text-link">
            {t("Open calendar")} <ArrowRight size={15} />
          </Link>
        </div>
        <div className="brief-metrics">
          <div>
            <CalendarDays size={19} />
            <span>{t("Still ahead today")}</span>
            <strong>{brief.upcoming.length}</strong>
            <small>{t("confirmed visits")}</small>
          </div>
          <div className={brief.outstandingOutcomes ? "needs-attention" : ""}>
            <ClipboardCheck size={19} />
            <span>{t("Needs an outcome")}</span>
            <strong>{brief.outstandingOutcomes}</strong>
            <small>{t("past or ongoing confirmed visits")}</small>
          </div>
          <div>
            <BadgeEuro size={19} />
            <span>{t("Completed-service value")}</span>
            <strong>{money(brief.completedValueMinor, locale)}</strong>
            <small>
              {brief.completedVisits}{" "}
              {t("completed today · not collected revenue")}
            </small>
          </div>
          {!b.supportMode && b.role !== "staff" && (
            <Link
              href={`/workspace/${slug}/opportunities/rebooking`}
              className={rebooking.count ? "has-opportunity" : ""}
            >
              <RefreshCcw size={19} />
              <span>{t("Customers due")}</span>
              <strong>{rebooking.count}</strong>
              <small>
                {money(rebooking.potential_value_minor, locale)}{" "}
                {t("potential service value")}
              </small>
            </Link>
          )}
        </div>
        <div className="brief-agenda">
          <div className="brief-agenda-heading">
            <strong>{t("Coming up")}</strong>
            <span>{t("Portugal local time")}</span>
          </div>
          {brief.upcoming.length ? (
            brief.upcoming.slice(0, 4).map((appointment) => (
              <Link
                href={`/workspace/${slug}/calendar?day=${brief.day}`}
                className="brief-appointment"
                key={appointment.id}
              >
                <time dateTime={appointment.starts_at}>
                  {slotLabel(appointment.starts_at, locale)}
                </time>
                <span>
                  <strong>
                    {b.supportMode
                      ? t("Customer details hidden")
                      : appointment.customers?.display_name}
                  </strong>
                  <small>
                    {appointment.service_name} ·{" "}
                    {appointment.staff_members?.display_name}
                  </small>
                </span>
                <ArrowRight size={15} />
              </Link>
            ))
          ) : (
            <div className="brief-empty">
              <CalendarDays size={21} />
              <span>{t("No more confirmed visits today.")}</span>
            </div>
          )}
          {brief.upcoming.length > 4 && (
            <Link
              href={`/workspace/${slug}/calendar?day=${brief.day}`}
              className="brief-more"
            >
              {locale === "pt"
                ? `Ver mais ${brief.upcoming.length - 4} na agenda`
                : `View ${brief.upcoming.length - 4} more in the calendar`}
            </Link>
          )}
        </div>
      </section>
      <section className="welcome-card">
        <div className="welcome-copy">
          <span className="pill-light">
            <span />
            {t("YOUR FOUNDATION IS TAKING SHAPE")}
          </span>
          <h2>
            {t("More time for the craft.")}
            <br />
            <em>{t("Less time on the rest.")}</em>
          </h2>
          <p>
            {t("Your services, your people, your opening hours.")}
            <br />
            {t("Everything starts with a shop that feels like you.")}
          </p>
          <Link href={`/workspace/${slug}/settings`} className="button cream">
            {t("Make it yours")} <ArrowRight size={16} />
          </Link>
        </div>
        <div className="brand-seal">
          <div className="seal-ring">
            <span>{t("YOUR NEIGHBOURHOOD SHOP")}</span>
            <strong>{initials(b.tenant.name)}</strong>
            <div className="seal-line" />
            <span>{t("CRAFTED AROUND YOU.")}</span>
          </div>
        </div>
      </section>
      <div className="stat-grid">
        <Link href={`/workspace/${slug}/services`} className="stat-card">
          <div>
            <span>{t("On the menu")}</span>
            <Scissors size={19} />
          </div>
          <strong>
            {activeServices.length.toString().padStart(2, "0")}
            <span>{t("services")}</span>
          </strong>
          <p>
            {t("A considered experience for every customer")}{" "}
            <ArrowUpRight size={14} />
          </p>
        </Link>
        <Link href={`/workspace/${slug}/team`} className="stat-card">
          <div>
            <span>{t("Behind the chair")}</span>
            <UsersRound size={19} />
          </div>
          <strong>
            {activeStaff.length.toString().padStart(2, "0")}
            <span>{t("barbers")}</span>
          </strong>
          <p>
            {t("The people who make your shop")} <ArrowUpRight size={14} />
          </p>
        </Link>
        <Link href={`/workspace/${slug}/hours`} className="stat-card">
          <div>
            <span>{t("Your working week")}</span>
            <Clock3 size={19} />
          </div>
          <strong>
            {hours}
            <span>{t("hours open")}</span>
          </strong>
          <p>
            {t("Working time, with breaks accounted for")}{" "}
            <ArrowUpRight size={14} />
          </p>
        </Link>
      </div>
      <div className="overview-grid">
        <section className="panel setup-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">{t("A STRONG START")}</span>
              <h2>{t("Your shop essentials")}</h2>
            </div>
            <span className="completion-count">
              {locale === "pt"
                ? `${completed} de 4 prontos`
                : `${completed} of 4 ready`}
            </span>
          </div>
          <div className="progress-track">
            <span style={{ width: `${completed * 25}%` }} />
          </div>
          {setup.map(({ label, detail, done, path, icon: Icon }) => (
            <Link
              href={`/workspace/${slug}${path}`}
              className="setup-row"
              key={path}
            >
              <span className={`setup-check ${done ? "done" : ""}`}>
                {done ? <Check size={16} /> : <Icon size={16} />}
              </span>
              <div>
                <strong>{label}</strong>
                <p>{detail}</p>
              </div>
              <ArrowRight size={17} />
            </Link>
          ))}
          <div className="setup-footnote">
            <CheckCircle2 size={17} />
            <span>{t("These details shape your customer experience.")}</span>
          </div>
        </section>
        <section className="panel week-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">{t("AT A GLANCE")}</span>
              <h2>{t("The regular week")}</h2>
            </div>
            <Link href={`/workspace/${slug}/hours`} className="text-link">
              {t("Edit")} <ArrowUpRight size={14} />
            </Link>
          </div>
          {trimHours(b.hours).map((row) => (
            <div
              key={row.weekday}
              className={`week-row ${!row.enabled ? "muted" : ""}`}
            >
              <span>
                {weekdayNames[locale][row.weekday] ?? weekdays[row.weekday]}
              </span>
              <strong>
                {row.enabled
                  ? `${row.start_time} – ${row.end_time}`
                  : t("Closed")}
              </strong>
            </div>
          ))}
          <p className="week-note">
            {t("Shop-local time · Breaks shown in working hours")}
          </p>
        </section>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">{t("GOOD HANDS")}</span>
            <h2>{t("The people behind your shop")}</h2>
          </div>
          <Link href={`/workspace/${slug}/team`} className="text-link">
            {t("Meet the team")} <ArrowRight size={16} />
          </Link>
        </div>
        <div className="team-strip">
          {activeStaff.map((s, i) => (
            <Link
              className="team-mini"
              key={s.id}
              href={`/workspace/${slug}/team/${s.id}`}
            >
              <span className={`avatar avatar-${i % 4}`}>
                {initials(s.display_name)}
              </span>
              <strong>{s.display_name}</strong>
              <span>{s.title}</span>
            </Link>
          ))}
        </div>
      </section>
      <div className="next-chapter">
        <div className="chapter-icon">
          <CalendarDays size={23} />
        </div>
        <div>
          <span className="eyebrow">{t("YOUR APPOINTMENTS")}</span>
          <h3>{t("A calendar built around your day.")}</h3>
          <p>
            {t(
              "Online appointments, rescheduling and a clear view of what’s ahead. Ready when you are.",
            )}
          </p>
        </div>
        <Link className="button secondary" href={`/workspace/${slug}/calendar`}>
          {t("Open calendar")}
        </Link>
      </div>
      <section className="services-preview">
        <h2>{t("A taste of your menu")}</h2>
        <div>
          {activeServices.slice(0, 3).map((s) => (
            <Link href={`/workspace/${slug}/services`} key={s.id}>
              <span>{s.name}</span>
              <strong>{money(s.price_minor, locale)}</strong>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
