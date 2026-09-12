"use client";
import { useActionState } from "react";
import { editCustomer } from "@/modules/customers/actions";
import type { CustomerSummary } from "@/modules/customers/model";
import { FormNotice, SubmitButton } from "./ui";
export function CustomerEdit({
  slug,
  customer,
}: {
  slug: string;
  customer: CustomerSummary;
}) {
  const [state, action] = useActionState(
    editCustomer.bind(null, slug, customer.id),
    { ok: false, message: "" },
  );
  return (
    <form action={action} className="customer-edit-form">
      <input type="hidden" name="version" value={customer.version} />
      <label>
        Name
        <input
          name="name"
          defaultValue={customer.display_name}
          required
          minLength={2}
          maxLength={80}
          autoComplete="off"
        />
      </label>
      <label>
        Email address
        <input
          type="email"
          name="email"
          defaultValue={customer.email}
          required
          maxLength={254}
          autoComplete="off"
        />
      </label>
      <p className="field-help">
        Changing an email address does not verify it or combine customer
        records.
      </p>
      <FormNotice state={state} />
      <SubmitButton>Save customer details</SubmitButton>
    </form>
  );
}
