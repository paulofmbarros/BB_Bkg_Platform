import { WorkspaceLink as Link } from "@/components/workspace-link";
import {
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  MailCheck,
  UsersRound,
} from "lucide-react";
import { Modal } from "@/components/ui";
import { CustomerOutreach } from "@/components/customer-outreach";
import { getRebookingOpportunities } from "@/modules/customers/opportunities";
import {
  opportunityReason,
  opportunityTiming,
} from "@/modules/customers/opportunity-model";
import { customerDate } from "@/modules/customers/format";
import { rebookingMessage } from "@/modules/customers/outreach-model";
import { money } from "@/lib/format";
import { localeOrEnglish, translator } from "@/i18n/locales";

export default async function RebookingOpportunities({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getRebookingOpportunities(slug);
  const path = `/workspace/${slug}/customers`;
  const locale = localeOrEnglish(result.tenant.workspace_locale);
  const t = translator(locale);

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t("REBOOKING OPPORTUNITIES")}</span>
          <h1>{t("Right customer. Right moment.")}</h1>
          <p>
            {t(
              "Explainable timing signals based on each customer’s completed visit history.",
            )}
          </p>
        </div>
        <Link className="button secondary" href={path}>
          {t("Open all customers")} <ArrowRight size={16} />
        </Link>
      </div>

      <section className="panel opportunity-summary" aria-label={t("Summary")}>
        <div>
          <UsersRound size={20} />
          <span>{t("Customers due or due soon")}</span>
          <strong>{result.total}</strong>
        </div>
        <div>
          <CalendarClock size={20} />
          <span>{t("Potential service value")}</span>
          <strong>{money(result.summary.potential_value_minor, locale)}</strong>
        </div>
        <div>
          <MailCheck size={20} />
          <span>{t("Recorded outreach actions")}</span>
          <strong>{result.outreachSummary.outreach_count}</strong>
        </div>
        <div>
          <CalendarCheck size={20} />
          <span>{t("Appointments attributed")}</span>
          <strong>{result.outreachSummary.attributed_bookings}</strong>
          <small>
            {money(
              result.outreachSummary.attributed_service_value_minor,
              locale,
            )}{" "}
            {t("service value")}
          </small>
        </div>
        <p>
          {t(
            "Potential and attributed service values use appointment prices. They are not collected or recovered revenue.",
          )}
        </p>
      </section>

      <p className="field-help opportunity-guidance">
        {t(
          "Noma records outreach but does not send messages. Outreach is available only after an explicit email opt-in has been recorded. Profiles with future bookings, unresolved visits or possible duplicate identities are excluded.",
        )}
      </p>

      <section
        className="opportunity-list"
        aria-label={t("Customers due to return")}
      >
        {result.opportunities.length ? (
          result.opportunities.map((opportunity) => {
            return (
              <article className="panel opportunity-card" key={opportunity.id}>
                <div className="opportunity-customer">
                  <span className="eyebrow">
                    {opportunityTiming(opportunity, locale)}
                  </span>
                  <h2>{opportunity.display_name}</h2>
                  <p>{opportunityReason(opportunity, locale)}</p>
                  <small>
                    {locale === "pt" ? "Última visita" : "Last visit"}{" "}
                    {customerDate(opportunity.last_visit_at, locale)} ·{" "}
                    {opportunity.completed_visit_days}{" "}
                    {locale === "pt"
                      ? "dias de visitas concluídas"
                      : "completed visit days"}
                  </small>
                </div>
                <div className="opportunity-service">
                  <span>{t("Most recent service")}</span>
                  <strong>{opportunity.service_name}</strong>
                  <small>
                    {opportunity.staff_name
                      ? `${locale === "pt" ? "com" : "with"} ${opportunity.staff_name}`
                      : t("Previous team member unavailable")}
                  </small>
                </div>
                <div className="opportunity-value">
                  <span>{t("Potential value")}</span>
                  <strong>
                    {money(opportunity.potential_value_minor, locale)}
                  </strong>
                  <small>{t("not recovered revenue")}</small>
                </div>
                <div className="opportunity-actions">
                  {opportunity.latestOutreach && (
                    <p className="outreach-status">
                      {t("Email outreach recorded")}{" "}
                      {customerDate(
                        opportunity.latestOutreach.contacted_at,
                        locale,
                      )}
                      {opportunity.latestOutreach.attributed_appointment_id
                        ? ` · ${t("appointment attributed")}`
                        : ` · ${t("awaiting outcome")}`}
                    </p>
                  )}
                  {!opportunity.marketing_consent ? (
                    <span className="status-badge segment-needs_review">
                      {t("No marketing opt-in")}
                    </span>
                  ) : (
                    <Modal
                      label={t("Record outreach")}
                      title={
                        locale === "pt"
                          ? `Registar contacto com ${opportunity.display_name}`
                          : `Record outreach to ${opportunity.display_name}`
                      }
                      className="button secondary"
                      icon={<MailCheck size={16} />}
                    >
                      <CustomerOutreach
                        slug={slug}
                        customerId={opportunity.id}
                        message={rebookingMessage(
                          opportunity.display_name,
                          opportunity.service_name,
                          result.tenant.name,
                          locale,
                        )}
                      />
                    </Modal>
                  )}
                  <Link
                    className="button secondary"
                    href={`${path}/${opportunity.id}`}
                    prefetch={false}
                  >
                    {t("View profile")}
                  </Link>
                  <Link
                    className="button primary"
                    href={`${path}/${opportunity.id}/book${opportunity.attributable ? `?outreach=${opportunity.latestOutreach!.id}` : ""}`}
                    prefetch={false}
                  >
                    {opportunity.attributable
                      ? t("Book & attribute")
                      : t("Book next visit")}
                  </Link>
                </div>
              </article>
            );
          })
        ) : (
          <div className="panel calendar-empty">
            <CalendarClock size={32} />
            <h2>{t("No customers are due right now.")}</h2>
            <p>
              {t(
                "Opportunities appear after at least three completed visit days establish a customer’s typical return interval.",
              )}
            </p>
          </div>
        )}
      </section>
      {result.total > result.opportunities.length && (
        <p className="field-help opportunity-limit">
          {t("Showing the 100 most overdue opportunities.")}
        </p>
      )}
    </>
  );
}
