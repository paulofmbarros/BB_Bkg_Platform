import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().trim().min(2).max(80),
  address: z.string().trim().max(240),
  phone: z.string().trim().max(40),
});
export const newClientSchema = clientSchema.extend({
  slug: z
    .string()
    .min(2)
    .max(63)
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers and hyphens.",
    ),
  email: z
    .email()
    .max(254)
    .transform((email) => email.toLowerCase()),
});
export const hostnameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(253)
  .regex(
    /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]*$/,
    "Enter a hostname without https:// or a path.",
  );
export type Invitation = {
  id: string;
  email: string;
  expires_at: string;
  accepted_at: string | null;
  cancelled_at: string | null;
  delivery_state: "pending" | "sending" | "sent" | "failed";
  delivery_error: string | null;
  sent_at: string | null;
};
export type PlatformClient = {
  id: string;
  slug: string;
  name: string;
  address: string;
  phone: string;
  active: boolean;
  is_demo: boolean;
  created_at: string;
  foundation: boolean;
  booking: boolean;
  services: number;
  staff: number;
  hours: number;
  domains: {
    hostname: string;
    verified_at: string | null;
    verification_token: string;
  }[];
  invitations: Invitation[];
  members: { user_id: string; email: string; role: string; active: boolean }[];
};
export type PlatformData = {
  clients: PlatformClient[];
  live_booking_ready: boolean;
};
export function invitationStatus(invite: Invitation, now = Date.now()) {
  if (invite.accepted_at) return "Accepted";
  if (invite.cancelled_at) return "Cancelled";
  if (Date.parse(invite.expires_at) <= now) return "Expired";
  return {
    pending: "Not sent",
    sending: "Sending",
    sent: "Awaiting owner",
    failed: "Delivery failed",
  }[invite.delivery_state];
}
export function setupSteps(client: PlatformClient) {
  return [
    {
      label: "Owner has access",
      complete: client.members.some((m) => m.active && m.role === "owner"),
    },
    { label: "Services added", complete: client.services > 0 },
    { label: "Barbers added", complete: client.staff > 0 },
    { label: "Opening hours set", complete: client.hours > 0 },
    {
      label: "Booking address verified",
      complete: client.domains.some((d) => !!d.verified_at),
    },
    { label: "Public booking enabled", complete: client.booking },
  ];
}
