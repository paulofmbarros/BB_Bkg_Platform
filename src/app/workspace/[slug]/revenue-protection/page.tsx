import {
  BellRing,
  CreditCard,
  RefreshCcw,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import {
  ProtectionPolicyForm,
  RecordDepositButton,
  RecordReminderButton,
  RefundDepositButton,
} from "@/components/revenue-protection";
import { getRevenueProtection } from "@/modules/revenue-protection/queries";
import { riskExplanation } from "@/modules/revenue-protection/model";
import { appointmentDate, slotLabel } from "@/modules/bookings/types";
import { localeOrEnglish, translator } from "@/i18n/locales";
import { money } from "@/lib/format";

export default async function RevenueProtection({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getRevenueProtection(slug);
  const locale = localeOrEnglish(result.tenant.workspace_locale);
  const t = translator(locale);
  const now = new Date(result.now).getTime();
  const actionable = result.appointments.filter(
    (appointment) =>
      appointment.deposit_state === "refund_due" ||
      (appointment.appointment_status === "confirmed" &&
        new Date(appointment.starts_at).getTime() > now &&
        (appointment.deposit_state === "pending" ||
          appointment.reminder_state === "due" ||
          appointment.risk_level !== "standard")),
  );
  const protectedAppointments = result.appointments.filter(
    (appointment) => appointment.protected_value_minor > 0,
  );

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t("REVENUE PROTECTION")}</span>
          <h1>{t("Protect the appointment, fairly.")}</h1>
          <p>
            {t(
              "Explainable attendance risk, clear deposit terms and conservative reporting.",
            )}
          </p>
        </div>
      </div>

      <section className="protection-summary" aria-label={t("Summary")}>
        <article className="panel">
          <TriangleAlert size={20} />
          <span>{t("At-risk upcoming visits")}</span>
          <strong>{result.summary.at_risk_upcoming}</strong>
        </article>
        <article className="panel">
          <CreditCard size={20} />
          <span>{t("Deposits secured")}</span>
          <strong>{money(result.summary.deposit_secured_minor, locale)}</strong>
        </article>
        <article className="panel">
          <BellRing size={20} />
          <span>{t("Reminders due")}</span>
          <strong>{result.summary.reminders_due}</strong>
        </article>
        <article className="panel">
          <ShieldCheck size={20} />
          <span>{t("Protected value")}</span>
          <strong>{money(result.summary.protected_value_minor, locale)}</strong>
        </article>
      </section>
      <p className="field-help protection-definition">
        {t(
          "Protected value counts only paid deposits retained after a no-show or a cancellation after the refund deadline. It is not total revenue or forecast revenue.",
        )}
      </p>

      <section className="panel protection-policy">
        <div className="section-heading compact">
          <span className="eyebrow">{t("POLICY")}</span>
          <h2>{t("Set transparent rules")}</h2>
          <p>
            {t(
              "Attendance history determines a visible risk tier. No opaque score or protected characteristic is used.",
            )}
          </p>
        </div>
        <ProtectionPolicyForm slug={slug} policy={result.policy} />
        <p className="field-help">
          {result.stripeConfigured
            ? t(
                "Stripe Checkout is configured. Eligible local payment methods are controlled in the Stripe account.",
              )
            : t(
                "Stripe Checkout is not configured. Deposits can be recorded manually for the pilot workflow.",
              )}
        </p>
      </section>

      <section className="protection-list-section">
        <div className="section-heading compact">
          <span className="eyebrow">{t("ACTION QUEUE")}</span>
          <h2>{t("Visits needing attention")}</h2>
        </div>
        <div className="protection-list">
          {actionable.length ? (
            actionable.map((appointment) => (
              <article
                className="panel protection-card"
                key={appointment.appointment_id}
              >
                <div className="protection-card-main">
                  <div className="protection-card-title">
                    <div>
                      <span
                        className={`status-badge risk-${appointment.risk_level}`}
                      >
                        {t(`${appointment.risk_level} risk`)}
                      </span>
                      <h3>{appointment.customer_name}</h3>
                    </div>
                    <strong>{money(appointment.price_minor, locale)}</strong>
                  </div>
                  <p>
                    {appointment.service_name} ·{" "}
                    {appointmentDate(appointment.starts_at, locale)} ·{" "}
                    {slotLabel(appointment.starts_at, locale)}
                  </p>
                  <p className="field-help">
                    {riskExplanation(appointment, locale)}
                  </p>
                  <div className="protection-states">
                    <span>
                      {t("Deposit")}:{" "}
                      {t(appointment.deposit_state.replaceAll("_", " "))}
                    </span>
                    <span>
                      {t("Reminder")}: {t(appointment.reminder_state)}
                    </span>
                  </div>
                </div>
                <div className="protection-card-actions">
                  {appointment.deposit_state === "pending" &&
                    appointment.deposit_required_minor > 0 && (
                      <>
                        <p>
                          <strong>
                            {money(appointment.deposit_required_minor, locale)}
                          </strong>{" "}
                          {t("deposit due")}
                        </p>
                        <RecordDepositButton
                          slug={slug}
                          appointment={appointment.appointment_id}
                        />
                      </>
                    )}
                  {appointment.reminder_state === "due" && (
                    <RecordReminderButton
                      slug={slug}
                      appointment={appointment.appointment_id}
                    />
                  )}
                  {appointment.deposit_state === "refund_due" &&
                    appointment.payment?.status === "paid" && (
                      <>
                        <p className="refund-due">
                          <RefreshCcw size={15} /> {t("Refund due")}
                        </p>
                        <RefundDepositButton
                          slug={slug}
                          payment={appointment.payment.id}
                        />
                      </>
                    )}
                </div>
              </article>
            ))
          ) : (
            <div className="panel calendar-empty">
              <ShieldCheck size={32} />
              <h3>{t("Nothing needs attention.")}</h3>
              <p>{t("Deposits, refunds and reminders are up to date.")}</p>
            </div>
          )}
        </div>
      </section>

      {protectedAppointments.length > 0 && (
        <section className="panel protected-evidence">
          <div className="section-heading compact">
            <span className="eyebrow">{t("EVIDENCE")}</span>
            <h2>{t("Protected value ledger")}</h2>
          </div>
          {protectedAppointments.map((appointment) => (
            <div
              className="protected-evidence-row"
              key={appointment.appointment_id}
            >
              <span>
                <strong>{appointment.customer_name}</strong>
                {appointment.service_name} ·{" "}
                {appointment.appointment_status === "no_show"
                  ? t("no show")
                  : t("late cancellation")}
              </span>
              <strong>
                {money(appointment.protected_value_minor, locale)}
              </strong>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
