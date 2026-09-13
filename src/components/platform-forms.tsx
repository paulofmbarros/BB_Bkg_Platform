"use client";
import { useActionState, type ReactNode } from "react";
import {
  createPlatformClient,
  managePlatformClient,
  sendOwnerInvitation,
} from "@/modules/platform/actions";
import type { PlatformClient } from "@/modules/platform/model";
import type { ActionResult } from "@/modules/businesses/actions";
import { FormNotice, SubmitButton } from "./ui";
const empty: ActionResult = { ok: false, message: "" };

function ContactFields({ client }: { client?: PlatformClient }) {
  return (
    <>
      <label>
        Barbershop name
        <input
          name="name"
          required
          minLength={2}
          maxLength={80}
          defaultValue={client?.name}
          placeholder="Downtown Barbers"
        />
      </label>
      <label>
        Address
        <input
          name="address"
          maxLength={240}
          defaultValue={client?.address}
          autoComplete="street-address"
        />
      </label>
      <label>
        Phone
        <input
          name="phone"
          type="tel"
          maxLength={40}
          defaultValue={client?.phone}
          autoComplete="tel"
        />
      </label>
    </>
  );
}
export function NewPlatformClientForm() {
  const [state, action] = useActionState(createPlatformClient, empty);
  return (
    <form action={action} className="edit-form">
      <ContactFields />
      <label>
        Shop identifier
        <input
          name="slug"
          required
          minLength={2}
          maxLength={63}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          placeholder="downtown-barbers"
          aria-describedby="slug-help"
        />
      </label>
      <p id="slug-help" className="field-help">
        A unique name for the workspace address. This cannot be changed later.
      </p>
      <label>
        Owner email
        <input
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
        />
      </label>
      <p className="field-help">
        The workspace uses EUR and the Europe/Lisbon time zone. Create it first,
        then review and send the owner invitation.
      </p>
      <FormNotice state={state} />
      <SubmitButton>Create workspace</SubmitButton>
    </form>
  );
}
export function PlatformForm({
  id,
  operation,
  children,
  label = "Save changes",
}: {
  id: string;
  operation: string;
  children?: ReactNode;
  label?: string;
}) {
  const fn =
    operation === "send"
      ? sendOwnerInvitation.bind(null, id)
      : managePlatformClient.bind(null, id, operation);
  const [state, action] = useActionState(fn, empty);
  return (
    <form action={action} className="edit-form platform-action-form">
      {children}
      <FormNotice state={state} />
      <SubmitButton
        className={
          ["cancel_invite", "membership", "domain_remove"].includes(operation)
            ? "button secondary"
            : "button primary"
        }
      >
        {label}
      </SubmitButton>
    </form>
  );
}
export function PlatformSettingsForm({
  client,
  bookingReady,
}: {
  client: PlatformClient;
  bookingReady: boolean;
}) {
  return (
    <PlatformForm id={client.id} operation="update">
      <ContactFields client={client} />
      <label className="platform-check">
        <input type="checkbox" name="active" defaultChecked={client.active} />
        Workspace access enabled
      </label>
      <p className="field-help">
        Turning off access suspends this shop’s workspace and public page. Its
        records and appointments are retained.
      </p>
      <label className="platform-check">
        <input
          type="checkbox"
          name="foundation"
          defaultChecked={client.foundation}
        />
        Business management enabled
      </label>
      <label className="platform-check">
        <input
          type="checkbox"
          name="booking"
          defaultChecked={client.booking}
          disabled={!bookingReady && !client.is_demo && !client.booking}
        />
        Booking enabled
      </label>
      {!bookingReady && !client.is_demo && (
        <p className="field-help">
          Live booking is locked until the platform’s production release checks
          are complete.
        </p>
      )}
    </PlatformForm>
  );
}
