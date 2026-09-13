import Link from "next/link";
import { Plus, ArrowUpRight, Store } from "lucide-react";
import { getPlatformClients } from "@/modules/platform/queries";
import { setupSteps } from "@/modules/platform/model";
export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { clients } = await getPlatformClients();
  const { q = "", status = "all" } = await searchParams;
  const search = q.trim().toLowerCase();
  const filtered = clients.filter(
    (c) =>
      `${c.name} ${c.slug} ${c.members.map((m) => m.email).join(" ")} ${c.invitations.map((i) => i.email).join(" ")}`
        .toLowerCase()
        .includes(search) &&
      (status === "all" || (status === "active" ? c.active : !c.active)),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR BUSINESSES</span>
          <h1>
            Clients<span className="accent-period">.</span>
          </h1>
          <p>
            Bring a new barbershop on board and keep every account in order.
          </p>
        </div>
        <Link className="button primary" href="/admin/clients/new">
          <Plus size={17} />
          Add barbershop
        </Link>
      </div>
      <div className="platform-stats">
        <div>
          <span>Total clients</span>
          <strong>{clients.length}</strong>
        </div>
        <div>
          <span>Access enabled</span>
          <strong>{clients.filter((c) => c.active).length}</strong>
        </div>
        <div>
          <span>Waiting for an owner</span>
          <strong>
            {
              clients.filter(
                (c) =>
                  c.active &&
                  !c.members.some((m) => m.role === "owner" && m.active),
              ).length
            }
          </strong>
        </div>
      </div>
      <section className="panel platform-directory">
        <form className="platform-filters">
          <label>
            Search clients
            <input
              name="q"
              defaultValue={q}
              placeholder="Shop name or owner email"
            />
          </label>
          <label>
            Account status
            <select name="status" defaultValue={status}>
              <option value="all">All clients</option>
              <option value="active">Access enabled</option>
              <option value="suspended">Suspended</option>
            </select>
          </label>
          <button className="button secondary">Search</button>
        </form>
        {filtered.length ? (
          <div className="platform-client-list">
            {filtered.map((c) => (
              <Link
                href={`/admin/clients/${c.id}`}
                className="platform-client-row"
                key={c.id}
              >
                <span className="platform-shop-icon">
                  <Store size={23} />
                </span>
                <div>
                  <h2>{c.name}</h2>
                  <p>
                    {c.members.find((m) => m.role === "owner" && m.active)
                      ?.email ??
                      c.invitations.find(
                        (i) => !i.cancelled_at && !i.accepted_at,
                      )?.email ??
                      "Owner invitation needed"}
                  </p>
                </div>
                <div className="platform-client-meta">
                  <span className="status-pill">
                    {c.active ? "Access enabled" : "Suspended"}
                  </span>
                  <small>
                    {setupSteps(c).filter((step) => step.complete).length} of 6
                    setup steps
                  </small>
                </div>
                <ArrowUpRight size={19} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="quiet-empty">
            {clients.length
              ? "No clients match your search."
              : "Your first client starts here. Add a barbershop to create its workspace."}
          </div>
        )}
      </section>
    </>
  );
}
