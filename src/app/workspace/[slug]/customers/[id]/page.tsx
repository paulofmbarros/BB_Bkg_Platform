import Link from "next/link";
import { CustomerSegment, SegmentRules } from "@/components/customer-segment";
import { ArrowLeft } from "lucide-react";
import { getCustomer } from "@/modules/customers/queries";
import { type QueryValues, historyFilters } from "@/modules/customers/model";
import { shopDate, slotLabel } from "@/modules/bookings/types";
import { customerDate } from "@/modules/customers/format";
import { initials, money } from "@/lib/format";
import { CustomerEdit } from "@/components/customer-edit";
import { CustomerPagination } from "@/components/customer-pagination";
import { UndoCustomerLink } from "@/components/customer-link";
import { Modal } from "@/components/ui";
const labels = {
  all: "All appointments",
  upcoming: "Upcoming",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-shows",
};
export default async function CustomerProfile({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<QueryValues>;
}) {
  const { slug, id } = await params,
    c = await getCustomer(slug, id, await searchParams),
    p = c.customer,
    path = `/workspace/${slug}/customers/${id}`;
  return (
    <>
      <Link className="text-link" href={`/workspace/${slug}/customers`}>
        <ArrowLeft size={16} />
        All customers
      </Link>
      <div className="page-heading customer-profile-heading">
        <div className="customer-profile-name">
          <span className="avatar large avatar-0">
            {initials(p.display_name)}
          </span>
          <div>
            <span className="eyebrow">CUSTOMER PROFILE</span>
            <h1>{p.display_name}</h1>
            <p>Customer since {customerDate(p.created_at)}</p>
          </div>
        </div>
        {c.role !== "staff" && (
          <Modal label="Edit details" title="Edit customer details">
            <CustomerEdit slug={slug} customer={p} />
          </Modal>
        )}
      </div>
      {c.role === "staff" && (
        <p className="notice">
          This profile shows only this customer’s appointments with you. Totals
          may differ from the shop’s full history.
        </p>
      )}
      {c.role !== "staff" && (
        <div className="booking-actions">
          <Link className="button primary" href={`${path}/book`}>
            Book next visit
          </Link>
        </div>
      )}
      <section className="customer-stats" aria-label="Customer visit totals">
        <article className="panel">
          <span>Completed visits</span>
          <strong>{p.completed_visits}</strong>
          <p>
            {p.last_visit_at
              ? `Last visit: ${customerDate(p.last_visit_at)}`
              : "No completed visits recorded"}
          </p>
        </article>
        <article className="panel">
          <span>Completed service value</span>
          <strong>{money(p.completed_value_minor)}</strong>
          <p>Service prices at the time of booking</p>
        </article>
        <article className="panel">
          <span>Average completed visit</span>
          <strong>
            {p.completed_visits ? money(p.average_visit_minor) : "—"}
          </strong>
          <p>Payments are not tracked yet</p>
        </article>
      </section>
      {c.segmentation && (
        <>
          <CustomerSegment customer={{ ...p, ...c.segmentation }} />
          <SegmentRules />
        </>
      )}
      <div className="customer-profile-grid">
        <section className="panel customer-contact">
          <h2>Contact & preferences</h2>
          <dl>
            <dt>Email address</dt>
            <dd>{p.email}</dd>
            <dt>Email verification</dt>
            <dd>
              {p.email_verified ? "Verified" : "Unverified guest details"}
            </dd>
            <dt>Marketing</dt>
            <dd>{p.marketing_consent ? "Opted in" : "Not subscribed"}</dd>
          </dl>
          {c.duplicates > 0 && (
            <div className="customer-duplicate-note">
              <strong>
                {c.duplicates} other{" "}
                {c.duplicates === 1 ? "record uses" : "records use"} this email
              </strong>
              <p>
                A matching email alone does not prove identity. These histories
                have not been combined.
              </p>
              <Link
                className="text-link"
                href={`/workspace/${slug}/customers?${new URLSearchParams({ q: p.email })}`}
              >
                Review matching records
              </Link>
            </div>
          )}
        </section>
        <section className="panel">
          <h2>Appointments at a glance</h2>
          <div className="customer-outcomes">
            <span>
              <strong>{p.upcoming_visits}</strong> upcoming
            </span>
            <span>
              <strong>{p.cancellations}</strong> cancelled
            </span>
            <span>
              <strong>{p.no_shows}</strong> no-shows
            </span>
          </div>
          <p>
            {p.next_visit_at
              ? `Next visit: ${customerDate(p.next_visit_at)} at ${slotLabel(p.next_visit_at)}`
              : "No upcoming appointment."}
          </p>
          {p.awaiting_outcome > 0 && (
            <p className="field-help">
              {p.awaiting_outcome} past or ongoing{" "}
              {p.awaiting_outcome === 1
                ? "appointment awaits"
                : "appointments await"}{" "}
              an outcome. These are not counted as completed visits.
            </p>
          )}
        </section>
      </div>
      {c.role !== "staff" && (
        <section className="panel customer-link-panel">
          <h2>Customer records</h2>
          <p>
            Confirmed this is a returning customer with another profile? Review
            both records before combining their histories.
          </p>
          <Link className="button secondary" href={`${path}/link`}>
            Link to an existing profile
          </Link>
          {c.links.map((link) => (
            <article className="customer-history-row" key={link.id}>
              <div>
                <h3>Linked from {link.source?.display_name}</h3>
                <p>
                  {link.source?.email} · {customerDate(link.created_at)}
                </p>
                <p>
                  {link.confirmation === "customer_confirmed"
                    ? "Customer confirmed directly"
                    : "Shop records reviewed"}
                </p>
              </div>
              <UndoCustomerLink slug={slug} id={link.id} />
            </article>
          ))}
        </section>
      )}
      <section className="panel customer-history">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">EVERY VISIT, IN ONE PLACE</span>
            <h2>Visit history</h2>
          </div>
        </div>
        <nav className="customer-history-tabs" aria-label="History filters">
          {historyFilters.map((filter) => (
            <Link
              key={filter}
              aria-current={c.filter === filter ? "page" : undefined}
              className={c.filter === filter ? "active" : ""}
              href={`${path}?filter=${filter}`}
            >
              {labels[filter]}
            </Link>
          ))}
        </nav>
        {c.appointments.length === 0 ? (
          <div className="calendar-empty">
            <h3>No appointments in this view.</h3>
            <p>Choose another filter to explore the customer’s history.</p>
          </div>
        ) : (
          <div>
            {c.appointments.map((a) => (
              <article className="customer-history-row" key={a.id}>
                <div>
                  <span className={`status-badge status-${a.status}`}>
                    {a.status.replace("_", " ")}
                  </span>
                  <h3>{a.service_name}</h3>
                  <p>
                    With {a.staff_members?.display_name} ·{" "}
                    {customerDate(a.starts_at)} · {slotLabel(a.starts_at)}
                  </p>
                </div>
                <div className="customer-history-value">
                  <strong>{money(a.price_minor)}</strong>
                  <Link
                    className="text-link"
                    href={`/workspace/${slug}/calendar?day=${shopDate(new Date(a.starts_at))}`}
                  >
                    View in calendar
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
        <CustomerPagination
          page={c.page}
          total={c.total}
          path={path}
          query={{ filter: c.filter }}
        />
      </section>
    </>
  );
}
