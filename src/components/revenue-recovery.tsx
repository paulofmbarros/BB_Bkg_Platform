"use client";

import { useActionState, useState } from "react";
import {
  bookRecovery,
  closeWaitlistEntry,
  createWaitlistEntry,
  recordRecoveryContact,
} from "@/modules/revenue-recovery/actions";
import { addDays, shopDate } from "@/modules/bookings/types";
import { FormNotice, SubmitButton } from "./ui";
import { useTranslations } from "@/i18n/provider";

type Option = { id: string; display_name: string };

export function WaitlistForm({
  slug,
  customers,
  services,
  staff,
}: {
  slug: string;
  customers: (Option & { email: string })[];
  services: { id: string; name: string }[];
  staff: (Option & { serviceIds: string[] })[];
}) {
  const t = useTranslations();
  const [service, setService] = useState(services[0]?.id ?? "");
  const [state, action] = useActionState(createWaitlistEntry.bind(null, slug), {
    ok: false,
    message: "",
  });
  const eligibleStaff = staff.filter((member) =>
    member.serviceIds.includes(service),
  );

  if (!customers.length)
    return (
      <p className="field-help">
        {t(
          "Record email consent on a customer profile before adding a waitlist request.",
        )}
      </p>
    );
  if (!services.length)
    return (
      <p className="field-help">
        {t("Add an active service before creating a waitlist request.")}
      </p>
    );

  return (
    <form action={action} className="recovery-waitlist-form">
      <label className="field">
        {t("Customer")}
        <select name="customer" required>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.display_name} · {customer.email}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        {t("Service")}
        <select
          name="service"
          value={service}
          required
          onChange={(event) => setService(event.target.value)}
        >
          {services.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        {t("Preferred team member")}
        <select name="staff" defaultValue="">
          <option value="">{t("Any available team member")}</option>
          {eligibleStaff.map((member) => (
            <option key={member.id} value={member.id}>
              {member.display_name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        {t("From")}
        <input
          type="date"
          name="earliest"
          min={shopDate()}
          max={addDays(shopDate(), 90)}
          defaultValue={shopDate()}
          required
        />
      </label>
      <label className="field">
        {t("Until")}
        <input
          type="date"
          name="latest"
          min={shopDate()}
          max={addDays(shopDate(), 90)}
          defaultValue={addDays(shopDate(), 30)}
          required
        />
      </label>
      <div className="recovery-form-action">
        <FormNotice state={state} />
        <SubmitButton>{t("Add to waitlist")}</SubmitButton>
      </div>
    </form>
  );
}

export function CloseWaitlistForm({
  slug,
  entryId,
}: {
  slug: string;
  entryId: string;
}) {
  const t = useTranslations();
  const [state, action] = useActionState(
    closeWaitlistEntry.bind(null, slug, entryId),
    { ok: false, message: "" },
  );
  return (
    <form action={action} className="compact-action-form">
      <FormNotice state={state} />
      <SubmitButton className="button secondary danger-text">
        {t("Close request")}
      </SubmitButton>
    </form>
  );
}

export function RecoveryContactForm({
  slug,
  entryId,
  sourceId,
  message,
}: {
  slug: string;
  entryId: string;
  sourceId: string;
  message: string;
}) {
  const t = useTranslations();
  const [state, action] = useActionState(
    recordRecoveryContact.bind(null, slug, entryId, sourceId),
    { ok: false, message: "" },
  );
  return (
    <form action={action} className="customer-outreach-form">
      <label>
        {t("Message sent")}
        <textarea
          name="message"
          defaultValue={message}
          minLength={1}
          maxLength={600}
          rows={5}
          required
        />
      </label>
      <label className="customer-link-ack">
        <input type="checkbox" name="confirmed" required />
        {t("I sent this message through an approved business email channel.")}
      </label>
      <p className="field-help">
        {t("Noma records this action but does not send the email.")}
      </p>
      <FormNotice state={state} />
      <SubmitButton>{t("Record recovery contact")}</SubmitButton>
    </form>
  );
}

export function RecoveryBookingForm({
  slug,
  actionId,
  requestId,
}: {
  slug: string;
  actionId: string;
  requestId: string;
}) {
  const t = useTranslations();
  const [state, action] = useActionState(
    bookRecovery.bind(null, slug, actionId),
    { ok: false, message: "" },
  );
  return (
    <form action={action} className="recovery-booking-form">
      <input type="hidden" name="request" value={requestId} />
      <label className="customer-link-ack">
        <input type="checkbox" name="accepted" required />
        {t("The customer accepted this exact time.")}
      </label>
      <FormNotice state={state} />
      <SubmitButton>{t("Book released time")}</SubmitButton>
    </form>
  );
}
