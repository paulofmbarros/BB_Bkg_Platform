import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { CheckCircle2, Circle } from "lucide-react";
import { getPlatformClients } from "@/modules/platform/queries";
import { invitationStatus, setupSteps } from "@/modules/platform/model";
import {
  PlatformForm,
  PlatformSettingsForm,
} from "@/components/platform-forms";
import { PlatformClientLinks } from "@/components/platform-client-links";
export default async function ClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { clients, live_booking_ready } = await getPlatformClients(id);
  const client = clients[0];
  if (!client) notFound();
  const centralOrigin = new URL(
    process.env.APP_ORIGIN ?? "http://127.0.0.1:3000",
  );
  const workspaceUrl = new URL(
    `/workspace/${encodeURIComponent(client.slug)}`,
    centralOrigin,
  ).toString();
  const primaryDomain = client.domains.find((domain) => domain.verified_at);
  const bookingUrl = primaryDomain
    ? `${centralOrigin.protocol}//${primaryDomain.hostname}${centralOrigin.port ? `:${centralOrigin.port}` : ""}/book`
    : null;
  return (
    <>
      <Link className="text-link" href="/admin">
        ← All clients
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">CLIENT WORKSPACE</span>
          <h1>{client.name}</h1>
          <p>{client.slug} · EUR · Europe/Lisbon</p>
        </div>
        <div className="platform-client-heading-actions">
          <span className="status-pill">
            {client.active ? "Access enabled" : "Suspended"}
          </span>
          <PlatformClientLinks
            workspaceUrl={workspaceUrl}
            bookingUrl={bookingUrl}
          />
        </div>
      </div>
      <div className="platform-detail-grid">
        <div>
          <section className="panel">
            <div className="panel-heading">
              <h2>Business and account</h2>
            </div>
            <PlatformSettingsForm
              client={client}
              bookingReady={live_booking_ready}
            />
          </section>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Owner invitations</h2>
                <p>
                  The owner sets up services, barbers, hours and branding after
                  accepting.
                </p>
              </div>
            </div>
            {client.invitations.map((invite) => {
              const status = invitationStatus(invite);
              const pending = !["Accepted", "Cancelled", "Expired"].includes(
                status,
              );
              return (
                <article key={invite.id} className="platform-record">
                  <div>
                    <strong>{invite.email}</strong>
                    <span className="status-pill">{status}</span>
                  </div>
                  <p>
                    Expires{" "}
                    {new Date(invite.expires_at).toLocaleDateString("en-GB", {
                      timeZone: "Europe/Lisbon",
                    })}
                  </p>
                  {invite.delivery_error && (
                    <p className="notice failure">{invite.delivery_error}</p>
                  )}
                  {pending && (
                    <div className="platform-row-actions">
                      <PlatformForm
                        id={id}
                        operation="send"
                        label={
                          invite.delivery_state === "pending"
                            ? "Send invitation"
                            : "Resend invitation"
                        }
                      >
                        <input type="hidden" name="id" value={invite.id} />
                      </PlatformForm>
                      <PlatformForm
                        id={id}
                        operation="cancel_invite"
                        label="Cancel invitation"
                      >
                        <input type="hidden" name="id" value={invite.id} />
                      </PlatformForm>
                    </div>
                  )}
                </article>
              );
            })}
            <PlatformForm
              id={id}
              operation="invite"
              label="Create owner invitation"
            >
              <label>
                Owner email
                <input type="email" name="email" required maxLength={254} />
              </label>
              <p className="field-help">
                Inviting another owner grants full shop management access.
                Existing owners keep their access.
              </p>
            </PlatformForm>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>People with access</h2>
            </div>
            {client.members.length ? (
              client.members.map((m) => (
                <article key={m.user_id} className="platform-record">
                  <strong>{m.email}</strong>
                  <p>
                    {m.role} · {m.active ? "Access enabled" : "Access revoked"}
                  </p>
                  <PlatformForm
                    id={id}
                    operation="membership"
                    label={m.active ? "Revoke access" : "Restore access"}
                  >
                    <input type="hidden" name="user_id" value={m.user_id} />
                    <input
                      type="hidden"
                      name="active"
                      value={String(!m.active)}
                    />
                  </PlatformForm>
                </article>
              ))
            ) : (
              <p className="quiet-empty">
                The owner will appear here once they accept their invitation.
              </p>
            )}
          </section>
        </div>
        <div>
          <section className="panel">
            <div className="panel-heading">
              <h2>Setup checklist</h2>
            </div>
            <ul className="platform-checklist">
              {setupSteps(client).map((step) => (
                <li key={step.label}>
                  {step.complete ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <Circle size={20} />
                  )}
                  <span>{step.label}</span>
                  <span className="platform-step-status">
                    {step.complete ? "Complete" : "Pending"}
                  </span>
                </li>
              ))}
            </ul>
            <p className="field-help">
              This tracks basic setup. Before launch, also check service
              assignments, staff availability and a test booking.
            </p>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>Booking addresses</h2>
            </div>
            {client.domains.map((d) => (
              <article key={d.hostname} className="platform-record">
                <strong>{d.hostname}</strong>
                <p>
                  {d.verified_at
                    ? "Ownership verified"
                    : "Awaiting verification"}
                </p>
                {!d.verified_at && (
                  <>
                    <p>Add this TXT record with your domain provider:</p>
                    <dl className="platform-dns">
                      <dt>Name</dt>
                      <dd>_barbershop-os.{d.hostname}</dd>
                      <dt>Value</dt>
                      <dd>barbershop-os={d.verification_token}</dd>
                    </dl>
                    <PlatformForm
                      id={id}
                      operation="domain_verify"
                      label="Verify DNS record"
                    >
                      <input type="hidden" name="hostname" value={d.hostname} />
                    </PlatformForm>
                  </>
                )}
                <PlatformForm
                  id={id}
                  operation="domain_remove"
                  label="Remove address"
                >
                  <input type="hidden" name="hostname" value={d.hostname} />
                </PlatformForm>
              </article>
            ))}
            <PlatformForm
              id={id}
              operation="domain_add"
              label="Add booking address"
            >
              <label>
                Hostname
                <input
                  name="hostname"
                  placeholder="book.downtownbarbers.com"
                  required
                  maxLength={253}
                />
              </label>
            </PlatformForm>
            <p className="field-help">
              Also attach the address to the application’s hosting project and
              configure its DNS routing. Ownership verification alone does not
              connect hosting.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
