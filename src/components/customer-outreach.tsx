"use client";

import { useActionState } from "react";
import { recordCustomerOutreach } from "@/modules/customers/outreach";
import { FormNotice, SubmitButton } from "./ui";

export function CustomerOutreach({
  slug,
  customerId,
  message,
}: {
  slug: string;
  customerId: string;
  message: string;
}) {
  const [state, action] = useActionState(
    recordCustomerOutreach.bind(null, slug, customerId),
    { ok: false, message: "" },
  );
  return (
    <form action={action} className="customer-outreach-form">
      <label>
        Message sent
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
        <input type="checkbox" name="confirmed" required />I sent this message
        through an approved business email channel.
      </label>
      <p className="field-help">
        Noma records this action but does not send the email. A booking can be
        attributed to it for 30 days.
      </p>
      <FormNotice state={state} />
      <SubmitButton>Record email outreach</SubmitButton>
    </form>
  );
}
