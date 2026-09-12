import Link from "next/link";
import { z } from "zod";
import { CalendarDays, ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { getBusiness } from "@/modules/businesses/queries";
import {
  addDays,
  appointmentDate,
  shopDate,
  slotLabel,
} from "@/modules/bookings/types";
import { publicShopUrl } from "@/modules/bookings/public-context";
import { money } from "@/lib/format";
import { AppointmentControls } from "@/components/appointment-controls";
export default async function Calendar({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ day?: string; staff?: string }>;
}) {
  const { slug } = await params,
    search = await searchParams,
    b = await getBusiness(slug);
  const day = z.iso.date().safeParse(search.day).success
    ? search.day!
    : shopDate();
  const { data, error } = await b.db
    .from("appointments")
    .select("*,customers(display_name,email),staff_members(display_name)")
    .eq("tenant_id", b.tenant.id)
    .gte("starts_at", `${addDays(day, -1)}T23:00:00Z`)
    .lt("starts_at", `${addDays(day, 1)}T00:00:00Z`)
    .order("starts_at");
  if (error) throw new Error("Could not load your calendar.");
  const appointments = (data ?? []).filter(
    (a) =>
      shopDate(new Date(a.starts_at)) === day &&
      (!search.staff || a.staff_id === search.staff),
  );
  const confirmed = appointments.filter((a) => a.status === "confirmed");
  const domain = b.domains.find((d) => d.verified_at);
  const path = `/workspace/${slug}/calendar`;
  const dayLink = (offset: number) =>
    `${path}?${new URLSearchParams({ day: addDays(day, offset), ...(search.staff ? { staff: search.staff } : {}) })}`;
  const visibleStaff =
    b.role === "staff"
      ? b.staff.filter((s) => s.user_id === b.user.id)
      : b.staff;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">TIME WELL SPENT</span>
          <h1>Your day, in good hands.</h1>
          <p>
            {b.role === "staff"
              ? "Your appointments and the people coming to see you."
              : "A clear view of who’s coming in and what’s next."}
          </p>
        </div>
        {domain && b.role !== "staff" && (
          <a
            className="button primary"
            href={`${publicShopUrl(domain.hostname)}/book`}
            target="_blank"
            rel="noreferrer"
          >
            <Plus size={16} />
            New appointment
          </a>
        )}
      </div>
      <section className="panel calendar-toolbar">
        <div className="calendar-date">
          <Link
            className="icon-button"
            href={dayLink(-1)}
            aria-label="Previous day"
          >
            <ArrowLeft size={18} />
          </Link>
          <h2>{appointmentDate(`${day}T12:00:00Z`)}</h2>
          <Link className="icon-button" href={dayLink(1)} aria-label="Next day">
            <ArrowRight size={18} />
          </Link>
        </div>
        <form className="calendar-filters">
          <label>
            Date
            <input type="date" name="day" defaultValue={day} required />
          </label>
          <label>
            Barber
            <select name="staff" defaultValue={search.staff ?? ""}>
              <option value="">
                {b.role === "staff" ? "My schedule" : "All barbers"}
              </option>
              {visibleStaff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.display_name}
                </option>
              ))}
            </select>
          </label>
          <button className="button secondary">Show day</button>
          <Link className="text-link" href={path}>
            Today
          </Link>
        </form>
      </section>
      <div className="calendar-summary">
        <span>
          <strong>{confirmed.length}</strong> confirmed visits
        </span>
        <span>
          <strong>
            {money(confirmed.reduce((sum, a) => sum + a.price_minor, 0))}
          </strong>{" "}
          scheduled value · unpaid
        </span>
        <span>Portugal local time</span>
      </div>
      <section
        className="calendar-agenda"
        aria-label="Appointments for selected day"
      >
        {appointments.length === 0 ? (
          <div className="panel calendar-empty">
            <CalendarDays size={34} />
            <h2>A little room in the day.</h2>
            <p>No appointments for this date and barber.</p>
            <p>New bookings will appear here once confirmed.</p>
          </div>
        ) : (
          appointments.map((a) => (
            <article
              className={`panel appointment-card appointment-${a.status}`}
              key={a.id}
            >
              <div className="appointment-time">
                <strong>{slotLabel(a.starts_at)}</strong>
                <span>to {slotLabel(a.ends_at)}</span>
              </div>
              <div className="appointment-detail">
                <span className={`status-badge status-${a.status}`}>
                  {a.status.replace("_", " ")}
                </span>
                <h2>
                  <Link href={`/workspace/${slug}/customers/${a.customer_id}`}>
                    {a.customers?.display_name}
                  </Link>
                </h2>
                <p>
                  {a.service_name} · {a.staff_members?.display_name}
                </p>
                <p className="field-help">{a.customers?.email}</p>
                <strong>{money(a.price_minor)}</strong>
                {a.status === "confirmed" && b.role !== "staff" && (
                  <AppointmentControls
                    slug={slug}
                    id={a.id}
                    version={a.version}
                    service={a.service_id}
                    staff={a.staff_id}
                    startsAt={a.starts_at}
                    endsAt={a.ends_at}
                  />
                )}
              </div>
            </article>
          ))
        )}
      </section>
      <p className="field-help">
        Changes to working hours apply to new bookings. Review existing
        appointments before adding leave or closures.
      </p>
    </>
  );
}
