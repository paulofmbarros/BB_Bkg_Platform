"use client";

import { useActionState } from "react";
import {
  recordManualDeposit,
  recordReminder,
  refundDeposit,
  saveProtectionPolicy,
} from "@/modules/revenue-protection/actions";
import type { ProtectionPolicy } from "@/modules/revenue-protection/model";
import { useTranslations } from "@/i18n/provider";
import { FormNotice, SubmitButton } from "./ui";

const initial = { ok: false, message: "" };

export function ProtectionPolicyForm({
  slug,
  policy,
}: {
  slug: string;
  policy: ProtectionPolicy;
}) {
  const t = useTranslations();
  const [state, action] = useActionState(
    saveProtectionPolicy.bind(null, slug),
    initial,
  );
  return (
    <form action={action} className="protection-policy-form">
      <label className="toggle-row">
        <input type="checkbox" name="enabled" defaultChecked={policy.enabled} />
        <span>
          <strong>{t("Revenue protection enabled")}</strong>
          <small>
            {t("New appointments receive a policy and risk snapshot.")}
          </small>
        </span>
      </label>
      <div className="form-grid protection-policy-grid">
        <label className="field">
          {t("Deposit rule")}
          <select name="deposit_rule" defaultValue={policy.deposit_rule}>
            <option value="none">{t("No deposits")}</option>
            <option value="risk_based">{t("Elevated risk only")}</option>
            <option value="all">{t("Every appointment")}</option>
          </select>
        </label>
        <label className="field">
          {t("Deposit percentage")}
          <input
            name="deposit_percent"
            type="number"
            min="10"
            max="100"
            defaultValue={policy.deposit_percent}
            required
          />
        </label>
        <label className="field">
          {t("Refund deadline (hours before)")}
          <input
            name="cancellation_window_hours"
            type="number"
            min="0"
            max="168"
            defaultValue={policy.cancellation_window_hours}
            required
          />
        </label>
        <label className="field">
          {t("Reminder lead time (hours)")}
          <input
            name="reminder_lead_hours"
            type="number"
            min="1"
            max="168"
            defaultValue={policy.reminder_lead_hours}
            required
          />
        </label>
      </div>
      <p className="field-help">
        {t(
          "Policy changes apply only to new appointments. Existing appointments keep the terms agreed when they were booked.",
        )}
      </p>
      <FormNotice state={state} />
      <SubmitButton>{t("Save protection policy")}</SubmitButton>
    </form>
  );
}

export function RecordDepositButton({
  slug,
  appointment,
}: {
  slug: string;
  appointment: string;
}) {
  const t = useTranslations();
  const [state, action] = useActionState(
    recordManualDeposit.bind(null, slug, appointment),
    initial,
  );
  return (
    <form action={action} className="protection-action-form">
      <FormNotice state={state} />
      <SubmitButton className="button secondary">
        {t("Record deposit paid")}
      </SubmitButton>
    </form>
  );
}

export function RecordReminderButton({
  slug,
  appointment,
}: {
  slug: string;
  appointment: string;
}) {
  const t = useTranslations();
  const [state, action] = useActionState(
    recordReminder.bind(null, slug, appointment),
    initial,
  );
  return (
    <form action={action} className="protection-action-form reminder-action">
      <label>
        <input type="checkbox" name="confirmed" required />
        {t("I sent the appointment reminder through an approved channel.")}
      </label>
      <FormNotice state={state} />
      <SubmitButton className="button secondary">
        {t("Record reminder")}
      </SubmitButton>
    </form>
  );
}

export function RefundDepositButton({
  slug,
  payment,
}: {
  slug: string;
  payment: string;
}) {
  const t = useTranslations();
  const [state, action] = useActionState(
    refundDeposit.bind(null, slug, payment),
    initial,
  );
  return (
    <form action={action} className="protection-action-form">
      <FormNotice state={state} />
      <SubmitButton className="button secondary danger-text">
        {t("Refund deposit")}
      </SubmitButton>
    </form>
  );
}
