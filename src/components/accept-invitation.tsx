"use client";
import { useActionState, useEffect, useRef } from "react";
import { acceptOwnerInvitation } from "@/modules/platform/actions";
import { FormNotice, SubmitButton } from "./ui";
export function AcceptInvitation({ id }: { id: string }) {
  const credentials = useRef({ access: "", refresh: "" });
  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    if (fragment.has("access_token")) {
      credentials.current = {
        access: fragment.get("access_token") ?? "",
        refresh: fragment.get("refresh_token") ?? "",
      };
    }
    if (window.location.hash)
      window.history.replaceState(null, "", window.location.pathname);
  }, []);
  const [state, action] = useActionState(
    async (previous: { ok: boolean; message: string }, form: FormData) => {
      form.set("access_token", credentials.current.access);
      form.set("refresh_token", credentials.current.refresh);
      return acceptOwnerInvitation(id, previous, form);
    },
    { ok: false, message: "" },
  );
  return (
    <form action={action} className="edit-form">
      <FormNotice state={state} />
      <SubmitButton>Accept invitation</SubmitButton>
    </form>
  );
}
