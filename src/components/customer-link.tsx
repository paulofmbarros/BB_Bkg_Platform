"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { linkCustomers, undoCustomerLink } from "@/modules/customers/actions";
import type { CustomerSummary } from "@/modules/customers/model";
import { FormNotice, SubmitButton } from "./ui";
export function CustomerLinkForm({
  slug,
  source,
  target,
}: {
  slug: string;
  source: CustomerSummary;
  target: CustomerSummary;
}) {
  const [state, action] = useActionState(
    linkCustomers.bind(null, slug, source.id, target.id),
    { ok: false, message: "" },
  );
  return state.ok ? (
    <div>
      <FormNotice state={state} />
      <Link
        className="button primary"
        href={`/workspace/${slug}/customers/${target.id}`}
      >
        Open retained profile
      </Link>
    </div>
  ) : (
    <form action={action} className="customer-edit-form">
      <input type="hidden" name="source_version" value={source.version} />
      <input type="hidden" name="target_version" value={target.version} />
      <input
        type="hidden"
        name="source_revision"
        value={source.history_revision}
      />
      <input
        type="hidden"
        name="target_revision"
        value={target.history_revision}
      />
      <label>
        How was the identity confirmed?
        <select name="confirmation" required defaultValue="">
          <option value="" disabled>
            Choose a confirmation method
          </option>
          <option value="customer_confirmed">
            The customer confirmed directly
          </option>
          <option value="records_reviewed">I checked the shop’s records</option>
        </select>
      </label>
      <label className="customer-link-ack">
        <input type="checkbox" name="acknowledge" required />I confirmed these
        records belong to the same customer.
      </label>
      <p className="field-help">
        Matching email addresses alone are not proof. You can undo this link
        from the retained profile.
      </p>
      <FormNotice state={state} />
      <SubmitButton>Link confirmed customer records</SubmitButton>
    </form>
  );
}
export function UndoCustomerLink({ slug, id }: { slug: string; id: string }) {
  const router = useRouter(),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  return (
    <div>
      {message && <p role="alert">{message}</p>}
      <button
        disabled={busy}
        className="button secondary"
        onClick={async () => {
          if (
            !window.confirm(
              "Undo this link? The original records will have separate histories again.",
            )
          )
            return;
          setBusy(true);
          try {
            const result = await undoCustomerLink(slug, id);
            if (result.ok) router.refresh();
            else setMessage(result.message);
          } catch {
            setMessage(
              "Unable to undo this link. Please reload and try again.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Undoing…" : "Undo link"}
      </button>
    </div>
  );
}
