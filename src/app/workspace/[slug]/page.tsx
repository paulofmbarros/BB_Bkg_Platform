import Link from "next/link";
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
} from "lucide-react";
import { getBusiness } from "@/modules/businesses/queries";
import { getBusinessBrief } from "@/modules/businesses/brief";
import { appointmentDate, slotLabel } from "@/modules/bookings/types";
import { weeklyHours, trimHours, weekdays } from "@/modules/scheduling/hours";
import { money, initials } from "@/lib/format";

export default async function Overview({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const b = await getBusiness(slug);
  const brief = await getBusinessBrief(b);
  const activeServices = b.services.filter((s) => s.active);
  const activeStaff = b.staff.filter((s) => s.active);
  const hours = weeklyHours(b.hours);
  const setup = [
    {
      label: "Make it your own",
      detail: "Business name, brand and contact details",
      done: !!b.branding.tagline && !!b.location.address,
      path: "/settings",
      icon: Palette,
    },
    {
      label: "Build your service menu",
      detail: `${activeServices.length} services ready to discover`,
      done: activeServices.length > 0,
      path: "/services",
      icon: Scissors,
    },
    {
      label: "Bring your team together",
      detail: `${activeStaff.length} barbers on your team`,
      done: activeStaff.length > 0,
      path: "/team",
      icon: UsersRound,
    },
    {
      label: "Set your working week",
      detail: `${hours} hours open each week`,
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
          <span className="eyebrow">THE BIG PICTURE</span>
          <h1>
            A good day starts here<span className="accent-period">.</span>
          </h1>
          <p>Let’s get {b.tenant.name} ready for its next chapter.</p>
        </div>
        <Link
          className="button secondary"
          href={`/preview/${slug}`}
          target="_blank"
        >
          Preview your shop <ArrowUpRight size={16} />
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
            <span className="eyebrow">TODAY AT A GLANCE</span>
            <h2 id="daily-brief-title">
              {appointmentDate(`${brief.day}T12:00:00Z`)}
            </h2>
            <p>
              {b.role === "staff" && !b.supportMode
                ? "A live snapshot of your own schedule."
                : "A live operational snapshot for the whole shop."}
            </p>
          </div>
          <Link href={`/workspace/${slug}/calendar`} className="text-link">
            Open calendar <ArrowRight size={15} />
          </Link>
        </div>
        <div className="brief-metrics">
          <div>
            <CalendarDays size={19} />
            <span>Still ahead today</span>
            <strong>{brief.upcoming.length}</strong>
            <small>confirmed visits</small>
          </div>
          <div className={brief.outstandingOutcomes ? "needs-attention" : ""}>
            <ClipboardCheck size={19} />
            <span>Needs an outcome</span>
            <strong>{brief.outstandingOutcomes}</strong>
            <small>past or ongoing confirmed visits</small>
          </div>
          <div>
            <BadgeEuro size={19} />
            <span>Completed-service value</span>
            <strong>{money(brief.completedValueMinor)}</strong>
            <small>
              {brief.completedVisits} completed today · not collected revenue
            </small>
          </div>
        </div>
        <div className="brief-agenda">
          <div className="brief-agenda-heading">
            <strong>Coming up</strong>
            <span>Portugal local time</span>
          </div>
          {brief.upcoming.length ? (
            brief.upcoming.slice(0, 4).map((appointment) => (
              <Link
                href={`/workspace/${slug}/calendar?day=${brief.day}`}
                className="brief-appointment"
                key={appointment.id}
              >
                <time dateTime={appointment.starts_at}>
                  {slotLabel(appointment.starts_at)}
                </time>
                <span>
                  <strong>
                    {b.supportMode
                      ? "Customer details hidden"
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
              <span>No more confirmed visits today.</span>
            </div>
          )}
          {brief.upcoming.length > 4 && (
            <Link
              href={`/workspace/${slug}/calendar?day=${brief.day}`}
              className="brief-more"
            >
              View {brief.upcoming.length - 4} more in the calendar
            </Link>
          )}
        </div>
      </section>
      <section className="welcome-card">
        <div className="welcome-copy">
          <span className="pill-light">
            <span />
            YOUR FOUNDATION IS TAKING SHAPE
          </span>
          <h2>
            More time for the craft.
            <br />
            <em>Less time on the rest.</em>
          </h2>
          <p>
            Your services, your people, your opening hours.
            <br />
            Everything starts with a shop that feels like you.
          </p>
          <Link href={`/workspace/${slug}/settings`} className="button cream">
            Make it yours <ArrowRight size={16} />
          </Link>
        </div>
        <div className="brand-seal">
          <div className="seal-ring">
            <span>YOUR NEIGHBOURHOOD SHOP</span>
            <strong>{initials(b.tenant.name)}</strong>
            <div className="seal-line" />
            <span>CRAFTED AROUND YOU.</span>
          </div>
        </div>
      </section>
      <div className="stat-grid">
        <Link href={`/workspace/${slug}/services`} className="stat-card">
          <div>
            <span>On the menu</span>
            <Scissors size={19} />
          </div>
          <strong>
            {activeServices.length.toString().padStart(2, "0")}
            <span>services</span>
          </strong>
          <p>
            A considered experience for every customer{" "}
            <ArrowUpRight size={14} />
          </p>
        </Link>
        <Link href={`/workspace/${slug}/team`} className="stat-card">
          <div>
            <span>Behind the chair</span>
            <UsersRound size={19} />
          </div>
          <strong>
            {activeStaff.length.toString().padStart(2, "0")}
            <span>barbers</span>
          </strong>
          <p>
            The people who make your shop <ArrowUpRight size={14} />
          </p>
        </Link>
        <Link href={`/workspace/${slug}/hours`} className="stat-card">
          <div>
            <span>Your working week</span>
            <Clock3 size={19} />
          </div>
          <strong>
            {hours}
            <span>hours open</span>
          </strong>
          <p>
            Working time, with breaks accounted for <ArrowUpRight size={14} />
          </p>
        </Link>
      </div>
      <div className="overview-grid">
        <section className="panel setup-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">A STRONG START</span>
              <h2>Your shop essentials</h2>
            </div>
            <span className="completion-count">{completed} of 4 ready</span>
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
            <span>These details shape your customer experience.</span>
          </div>
        </section>
        <section className="panel week-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">AT A GLANCE</span>
              <h2>The regular week</h2>
            </div>
            <Link href={`/workspace/${slug}/hours`} className="text-link">
              Edit <ArrowUpRight size={14} />
            </Link>
          </div>
          {trimHours(b.hours).map((row) => (
            <div
              key={row.weekday}
              className={`week-row ${!row.enabled ? "muted" : ""}`}
            >
              <span>{weekdays[row.weekday]}</span>
              <strong>
                {row.enabled ? `${row.start_time} – ${row.end_time}` : "Closed"}
              </strong>
            </div>
          ))}
          <p className="week-note">
            Shop-local time · Breaks shown in working hours
          </p>
        </section>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">GOOD HANDS</span>
            <h2>The people behind your shop</h2>
          </div>
          <Link href={`/workspace/${slug}/team`} className="text-link">
            Meet the team <ArrowRight size={16} />
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
          <span className="eyebrow">YOUR APPOINTMENTS</span>
          <h3>A calendar built around your day.</h3>
          <p>
            Online appointments, rescheduling and a clear view of what’s ahead.
            Ready when you are.
          </p>
        </div>
        <Link className="button secondary" href={`/workspace/${slug}/calendar`}>
          Open calendar
        </Link>
      </div>
      <section className="services-preview">
        <h2>A taste of your menu</h2>
        <div>
          {activeServices.slice(0, 3).map((s) => (
            <Link href={`/workspace/${slug}/services`} key={s.id}>
              <span>{s.name}</span>
              <strong>{money(s.price_minor)}</strong>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
