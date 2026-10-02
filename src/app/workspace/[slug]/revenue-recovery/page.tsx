import { randomUUID } from "node:crypto";
import {
  CalendarCheck,
  CalendarClock,
  MailCheck,
  Plus,
  RefreshCw,
  UsersRound,
} from "lucide-react";
import { Modal } from "@/components/ui";
import {
  CloseWaitlistForm,
  RecoveryBookingForm,
  RecoveryContactForm,
  WaitlistForm,
} from "@/components/revenue-recovery";
import { appointmentDate, slotLabel } from "@/modules/bookings/types";
import { getRevenueRecovery } from "@/modules/revenue-recovery/queries";
import { money } from "@/lib/format";
import { localeOrEnglish, translator } from "@/i18n/locales";

export default async function RevenueRecovery({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getRevenueRecovery(slug);
  const locale = localeOrEnglish(result.tenant.workspace_locale);
  const t = translator(locale);

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t("REVENUE RECOVERY")}</span>
          <h1>{t("Put released time back to work.")}</h1>
          <p>
            {t(
              "Match cancelled appointments to consented customer requests, with evidence from contact to outcome.",
            )}
          </p>
        </div>
        <Modal
          label={t("Add waitlist request")}
          title={t("Add a customer to the waitlist")}
          className="button primary"
          icon={<Plus size={16} />}
        >
          <WaitlistForm
            slug={slug}
            customers={result.customers}
            services={result.services}
            staff={result.staff}
          />
        </Modal>
      </div>

      <section className="panel opportunity-summary" aria-label={t("Summary")}>
        <div>
          <CalendarClock size={20} />
          <span>{t("Open cancelled slots")}</span>
          <strong>{result.summary.open_slots}</strong>
        </div>
        <div>
          <UsersRound size={20} />
          <span>{t("Customer matches")}</span>
          <strong>{result.summary.matching_customers}</strong>
        </div>
        <div>
          <MailCheck size={20} />
          <span>{t("Recovery contacts")}</span>
          <strong>{result.summary.contacts_recorded}</strong>
        </div>
        <div>
          <CalendarCheck size={20} />
          <span>{t("Appointments attributed")}</span>
          <strong>{result.summary.bookings_attributed}</strong>
          <small>
            {money(result.summary.booked_service_value_minor, locale)}{" "}
            {t("booked service value")}
          </small>
        </div>
        <p>
          {t(
            "Recovered value counts only attributed appointments that were completed.",
          )}{" "}
          {money(result.summary.completed_recovered_value_minor, locale)}.
        </p>
      </section>

      <p className="field-help opportunity-guidance">
        {t(
          "Noma does not send messages. Matches require recorded email consent and use only the requested service, date window and optional team preference.",
        )}
      </p>

      <div className="recovery-section-heading">
        <div>
          <span className="eyebrow">{t("ACTION QUEUE")}</span>
          <h2>{t("Cancellation matches")}</h2>
        </div>
        <span>{result.opportunities.length}</span>
      </div>
      <section
        className="opportunity-list"
        aria-label={t("Cancellation matches")}
      >
        {result.opportunities.length ? (
          result.opportunities.map((opportunity) => {
            const message =
              locale === "pt"
                ? `Olá ${opportunity.customer_name.split(" ")[0]}, surgiu uma vaga para ${opportunity.service_name} em ${appointmentDate(opportunity.starts_at, locale)} às ${slotLabel(opportunity.starts_at, locale)}. Responda se quiser reservar. — ${result.tenant.name}`
                : `Hi ${opportunity.customer_name.split(" ")[0]}, a ${opportunity.service_name} time opened on ${appointmentDate(opportunity.starts_at, locale)} at ${slotLabel(opportunity.starts_at, locale)}. Reply if you would like it. — ${result.tenant.name}`;
            return (
              <article
                className="panel recovery-opportunity"
                key={`${opportunity.waitlist_entry_id}:${opportunity.source_appointment_id}`}
              >
                <div className="recovery-slot">
                  <span className="eyebrow">{t("RELEASED TIME")}</span>
                  <h2>{appointmentDate(opportunity.starts_at, locale)}</h2>
                  <strong>{slotLabel(opportunity.starts_at, locale)}</strong>
                  <p>
                    {opportunity.service_name} · {opportunity.staff_name}
                  </p>
                  <small>
                    {money(opportunity.price_minor, locale)}{" "}
                    {t("current service value")}
                  </small>
                </div>
                <div className="recovery-match">
                  <span className="eyebrow">{t("WAITLIST MATCH")}</span>
                  <h2>{opportunity.customer_name}</h2>
                  <p>{opportunity.customer_email}</p>
                  <small>{t(opportunity.match_reason)}</small>
                </div>
                <div className="opportunity-actions">
                  {opportunity.recovery_action_id ? (
                    <>
                      <p className="outreach-status">
                        {t("Recovery contact recorded")} ·{" "}
                        {opportunity.contacted_at
                          ? appointmentDate(opportunity.contacted_at, locale)
                          : ""}
                      </p>
                      <RecoveryBookingForm
                        slug={slug}
                        actionId={opportunity.recovery_action_id}
                        requestId={randomUUID()}
                      />
                    </>
                  ) : (
                    <Modal
                      label={t("Record contact")}
                      title={
                        locale === "pt"
                          ? `Contactar ${opportunity.customer_name}`
                          : `Contact ${opportunity.customer_name}`
                      }
                      icon={<MailCheck size={16} />}
                    >
                      <RecoveryContactForm
                        slug={slug}
                        entryId={opportunity.waitlist_entry_id}
                        sourceId={opportunity.source_appointment_id}
                        message={message}
                      />
                    </Modal>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <div className="panel calendar-empty">
            <RefreshCw size={32} />
            <h2>{t("No cancellation matches right now.")}</h2>
            <p>
              {t(
                "Future cancellations appear here when they match an active waitlist request.",
              )}
            </p>
          </div>
        )}
      </section>

      <div className="recovery-section-heading">
        <div>
          <span className="eyebrow">{t("WAITLIST")}</span>
          <h2>{t("Active customer requests")}</h2>
        </div>
        <span>{result.waitlist.length}</span>
      </div>
      <section
        className="recovery-waitlist"
        aria-label={t("Active customer requests")}
      >
        {result.waitlist.length ? (
          result.waitlist.map((entry) => (
            <article className="panel recovery-waitlist-card" key={entry.id}>
              <div>
                <h3>
                  {entry.customer?.display_name ?? t("Customer unavailable")}
                </h3>
                <p>{entry.service?.name ?? t("Service unavailable")}</p>
              </div>
              <div>
                <span>{t("Date window")}</span>
                <strong>
                  {entry.earliest_date} → {entry.latest_date}
                </strong>
              </div>
              <div>
                <span>{t("Team preference")}</span>
                <strong>
                  {entry.preferredStaff?.display_name ??
                    t("Any available team member")}
                </strong>
              </div>
              <CloseWaitlistForm slug={slug} entryId={entry.id} />
            </article>
          ))
        ) : (
          <p className="field-help">{t("No active waitlist requests.")}</p>
        )}
      </section>
    </>
  );
}
