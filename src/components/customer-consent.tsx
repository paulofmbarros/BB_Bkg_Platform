"use client";

import { useActionState } from "react";
import { setCustomerMarketingConsent } from "@/modules/customers/actions";
import { FormNotice, SubmitButton } from "./ui";

export function CustomerConsent({
  slug,
  customer,
}: {
  slug: string;
  customer: { id: string; version: number; marketing_consent: boolean };
}) {
  const [state, action] = useActionState(
    setCustomerMarketingConsent.bind(null, slug, customer.id),
    { ok: false, message: "" },
  );
  const next = customer.marketing_consent ? "withdraw" : "grant";
  return (
    <form action={action} className="consent-form">
      <input type="hidden" name="version" value={customer.version} />
      <input type="hidden" name="consent" value={next} />
      <label className="customer-link-ack">
        <input type="checkbox" name="confirmed" required />
        {customer.marketing_consent
          ? "The customer directly asked to stop receiving marketing messages."
          : "The customer directly asked to receive rebooking marketing by email."}
      </label>
      <p className="field-help">
        Record only the customer’s explicit request. An appointment email or
        existing customer relationship is not marketing consent.
      </p>
      <FormNotice state={state} />
      <SubmitButton className="button secondary">
        {customer.marketing_consent ? "Record opt-out" : "Record email opt-in"}
      </SubmitButton>
    </form>
  );
}
