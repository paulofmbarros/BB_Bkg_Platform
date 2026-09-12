import Link from "next/link";
import { segments, segmentLabels } from "@/modules/customers/segments";
import { SegmentRules } from "@/components/customer-segment";
import { ArrowUpRight, Search, UsersRound } from "lucide-react";
import { getCustomers } from "@/modules/customers/queries";
import type { QueryValues } from "@/modules/customers/model";
import { initials, money } from "@/lib/format";
import { customerDate } from "@/modules/customers/format";
import { CustomerPagination } from "@/components/customer-pagination";
export default async function Customers({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<QueryValues>;
}) {
  const { slug } = await params,
    c = await getCustomers(slug, await searchParams),
    path = `/workspace/${slug}/customers`;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">THE PEOPLE WHO COME BACK</span>
          <h1>Familiar faces. New stories.</h1>
          <p>
            {c.role === "staff"
              ? "Your customers and their visits with you."
              : "Customer details and the visits behind each relationship."}
          </p>
        </div>
      </div>
      <section className="panel">
        <form className="customer-search">
          {c.segment && (
            <input type="hidden" name="segment" value={c.segment} />
          )}
          <label htmlFor="customer-query">Find a customer</label>
          <div>
            <Search size={18} />
            <input
              id="customer-query"
              name="q"
              defaultValue={c.q}
              placeholder="Search name or email"
              maxLength={100}
            />
            <button className="button primary">Search</button>
            {c.q && (
              <Link href={path} className="text-link">
                Clear
              </Link>
            )}
          </div>
        </form>
      </section>
      <p className="field-help customer-scope">
        {c.role === "staff"
          ? "Visit totals show only appointments assigned to you."
          : "Completed service value reflects attended visits, not payments collected."}{" "}
        Matching email addresses do not combine guest histories.
      </p>
      {c.role !== "staff" && (
        <>
          <nav
            className="customer-history-tabs segment-tabs"
            aria-label="Customer segments"
          >
            <Link
              aria-current={!c.segment ? "page" : undefined}
              className={!c.segment ? "active" : ""}
              href={`${path}?${new URLSearchParams({ q: c.q })}`}
            >
              All · {c.counts.reduce((n, r) => n + r.count, 0)}
            </Link>
            {segments.map((s) => (
              <Link
                key={s}
                aria-current={c.segment === s ? "page" : undefined}
                className={c.segment === s ? "active" : ""}
                href={`${path}?${new URLSearchParams({ q: c.q, segment: s })}`}
              >
                {segmentLabels[s]} ·{" "}
                {c.counts.find((r) => r.segment === s)?.count ?? 0}
              </Link>
            ))}
          </nav>
          <SegmentRules />
        </>
      )}
      <section className="customer-list" aria-label="Customer directory">
        {c.customers.length === 0 ? (
          <div className="panel calendar-empty">
            <UsersRound size={32} />
            <h2>
              {c.q || c.segment
                ? "No matching customers."
                : "Your next relationship starts here."}
            </h2>
            <p>
              {c.q || c.segment
                ? "Try another segment, name or email address."
                : "Customers appear here when an appointment is booked."}
            </p>
          </div>
        ) : (
          c.customers.map((customer, i) => (
            <Link
              className="panel customer-row"
              href={`${path}/${customer.id}`}
              key={customer.id}
            >
              <span className={`avatar avatar-${i % 4}`}>
                {initials(customer.display_name)}
              </span>
              <div className="customer-identity">
                <h2>{customer.display_name}</h2>
                {customer.segment && (
                  <span className={`status-badge segment-${customer.segment}`}>
                    {segmentLabels[customer.segment]}
                  </span>
                )}
                <p>{customer.email}</p>
              </div>
              <div className="customer-row-metric">
                <strong>
                  {customer.completed_visits}{" "}
                  {customer.completed_visits === 1 ? "visit" : "visits"}
                </strong>
                <span>
                  {customer.last_visit_at
                    ? `Last seen ${customerDate(customer.last_visit_at)}`
                    : "No completed visits yet"}
                </span>
              </div>
              <div className="customer-row-value">
                <strong>{money(customer.completed_value_minor)}</strong>
                <span>Completed services</span>
              </div>
              <ArrowUpRight size={18} />
            </Link>
          ))
        )}
      </section>
      <CustomerPagination
        page={c.page}
        total={c.total}
        path={path}
        query={{ q: c.q, ...(c.segment ? { segment: c.segment } : {}) }}
      />
    </>
  );
}
