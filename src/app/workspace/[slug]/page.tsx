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
} from "lucide-react";
import { getBusiness } from "@/modules/businesses/queries";
import { weeklyHours, trimHours, weekdays } from "@/modules/scheduling/hours";
import { money, initials } from "@/lib/format";

export default async function Overview({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const b = await getBusiness(slug);
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
