import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomer, getCustomers } from "@/modules/customers/queries";
import { scalar, type QueryValues } from "@/modules/customers/model";
import { CustomerLinkForm } from "@/components/customer-link";
import { CustomerPagination } from "@/components/customer-pagination";
import { money } from "@/lib/format";
export default async function LinkCustomer({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<QueryValues>;
}) {
  const { slug, id } = await params,
    search = await searchParams,
    source = await getCustomer(slug, id, {});
  if (source.role === "staff") notFound();
  const targetId = scalar(search.target),
    path = `/workspace/${slug}/customers/${id}/link`;
  const target =
    targetId && targetId !== id ? await getCustomer(slug, targetId, {}) : null;
  const candidates = target
    ? null
    : await getCustomers(slug, {
        ...search,
        q: search.q ?? source.customer.email,
      });
  return (
    <>
      <Link className="text-link" href={`/workspace/${slug}/customers/${id}`}>
        Back to customer profile
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ONE CUSTOMER, ONE HISTORY</span>
          <h1>Review customer records.</h1>
          <p>
            Choose the existing profile to keep for{" "}
            {source.customer.display_name}.
          </p>
        </div>
      </div>
      {target ? (
        <>
          <div className="customer-profile-grid">
            {[
              [source.customer, "Record being linked"],
              [target.customer, "Profile to keep"],
            ].map(([value, label]) => {
              const c = value as typeof source.customer;
              return (
                <section className="panel" key={c.id}>
                  <span className="eyebrow">{String(label)}</span>
                  <h2>{c.display_name}</h2>
                  <p>{c.email}</p>
                  <p>
                    {c.appointment_count} appointments · {c.completed_visits}{" "}
                    completed visits
                  </p>
                  <strong>
                    {money(c.completed_value_minor)} in completed services
                  </strong>
                </section>
              );
            })}
          </div>
          <section className="panel">
            <h2>What will change</h2>
            <p>
              All {source.customer.appointment_count} appointments move into{" "}
              {target.customer.display_name}’s history. The linked record will
              be hidden from the directory.
            </p>
            <p>
              The retained profile keeps its name, email and marketing
              preference. Linking does not verify an email or expand access
              through a guest booking link.
            </p>
            <CustomerLinkForm
              slug={slug}
              source={source.customer}
              target={target.customer}
            />
            <Link className="text-link" href={path}>
              Choose a different profile
            </Link>
          </section>
        </>
      ) : (
        <>
          <section className="panel">
            <form className="customer-search">
              <label htmlFor="link-search">Find the existing customer</label>
              <div>
                <input
                  id="link-search"
                  name="q"
                  defaultValue={candidates?.q}
                  maxLength={100}
                  placeholder="Search name or email"
                />
                <button className="button primary">Search</button>
              </div>
            </form>
            <p className="field-help">
              Suggested matches are not verified identities. Check with the
              customer or the shop’s records before linking.
            </p>
          </section>
          <section className="customer-list">
            {candidates?.customers
              .filter((c) => c.id !== id)
              .map((c) => (
                <Link
                  className="panel"
                  key={c.id}
                  href={`${path}?target=${c.id}`}
                >
                  <h2>{c.display_name}</h2>
                  <p>
                    {c.email} · {c.appointment_count} appointments
                  </p>
                  <span className="text-link">Review this profile</span>
                </Link>
              ))}
            {!candidates?.customers.some((c) => c.id !== id) && (
              <p>
                No other matching profiles. Search by name or another email.
              </p>
            )}
          </section>
          {candidates && (
            <CustomerPagination
              page={candidates.page}
              total={candidates.total}
              path={path}
              query={{ q: candidates.q }}
            />
          )}
        </>
      )}
    </>
  );
}
