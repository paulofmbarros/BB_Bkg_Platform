import Link from "next/link";
import { ArrowRight, CalendarClock, UsersRound } from "lucide-react";
import { getRebookingOpportunities } from "@/modules/customers/opportunities";
import {
  opportunityReason,
  opportunityTiming,
} from "@/modules/customers/opportunity-model";
import { customerDate } from "@/modules/customers/format";
import { money } from "@/lib/format";

export default async function RebookingOpportunities({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getRebookingOpportunities(slug);
  const path = `/workspace/${slug}/customers`;

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">REBOOKING OPPORTUNITIES</span>
          <h1>Right customer. Right moment.</h1>
          <p>
            Explainable timing signals based on each customer’s completed visit
            history.
          </p>
        </div>
        <Link className="button secondary" href={path}>
          Open all customers <ArrowRight size={16} />
        </Link>
      </div>

      <section className="panel opportunity-summary" aria-label="Summary">
        <div>
          <UsersRound size={20} />
          <span>Customers due or due soon</span>
          <strong>{result.total}</strong>
        </div>
        <div>
          <CalendarClock size={20} />
          <span>Potential service value</span>
          <strong>{money(result.summary.potential_value_minor)}</strong>
        </div>
        <p>
          Potential value uses each customer’s most recent completed service. It
          is not forecast, booked, collected or recovered revenue.
        </p>
      </section>

      <p className="field-help opportunity-guidance">
        No message is sent from this screen. Confirm the customer wants an
        appointment before booking, and use contact details only with an
        appropriate lawful basis. Profiles with future bookings, unresolved
        visits or possible duplicate identities are excluded.
      </p>

      <section
        className="opportunity-list"
        aria-label="Customers due to return"
      >
        {result.opportunities.length ? (
          result.opportunities.map((opportunity) => (
            <article className="panel opportunity-card" key={opportunity.id}>
              <div className="opportunity-customer">
                <span className="eyebrow">
                  {opportunityTiming(opportunity)}
                </span>
                <h2>{opportunity.display_name}</h2>
                <p>{opportunityReason(opportunity)}</p>
                <small>
                  Last visit {customerDate(opportunity.last_visit_at)} ·{" "}
                  {opportunity.completed_visit_days} completed visit days
                </small>
              </div>
              <div className="opportunity-service">
                <span>Most recent service</span>
                <strong>{opportunity.service_name}</strong>
                <small>
                  {opportunity.staff_name
                    ? `with ${opportunity.staff_name}`
                    : "Previous team member unavailable"}
                </small>
              </div>
              <div className="opportunity-value">
                <span>Potential value</span>
                <strong>{money(opportunity.potential_value_minor)}</strong>
                <small>not recovered revenue</small>
              </div>
              <div className="opportunity-actions">
                <Link
                  className="button secondary"
                  href={`${path}/${opportunity.id}`}
                >
                  View profile
                </Link>
                <Link
                  className="button primary"
                  href={`${path}/${opportunity.id}/book`}
                >
                  Book next visit
                </Link>
              </div>
            </article>
          ))
        ) : (
          <div className="panel calendar-empty">
            <CalendarClock size={32} />
            <h2>No customers are due right now.</h2>
            <p>
              Opportunities appear after at least three completed visit days
              establish a customer’s typical return interval.
            </p>
          </div>
        )}
      </section>
      {result.total > result.opportunities.length && (
        <p className="field-help opportunity-limit">
          Showing the 100 most overdue opportunities.
        </p>
      )}
    </>
  );
}
