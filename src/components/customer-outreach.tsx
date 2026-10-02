"use client";

import { useActionState } from "react";
import { recordCustomerOutreach } from "@/modules/customers/outreach";
import { FormNotice, SubmitButton } from "./ui";
import { useTranslations } from "@/i18n/provider";

export function CustomerOutreach({
  slug,
  customerId,
  message,
}: {
  slug: string;
  customerId: string;
  message: string;
}) {
  const t = useTranslations();
  const [state, action] = useActionState(
    recordCustomerOutreach.bind(null, slug, customerId),
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
          rows={6}
          required
        />
      </label>
      <label className="customer-link-ack">
        <input type="checkbox" name="confirmed" required />
        {t("I sent this message through an approved business email channel.")}
      </label>
      <p className="field-help">
        {t(
          "Noma records this action but does not send the email. A booking can be attributed to it for 30 days.",
        )}
      </p>
      <FormNotice state={state} />
      <SubmitButton>{t("Record email outreach")}</SubmitButton>
    </form>
  );
}
