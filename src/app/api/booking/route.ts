import { type NextRequest } from "next/server";
import { z } from "zod";
import { createPublicClient } from "@/lib/supabase/server";
import { normalizeHost } from "@/modules/tenancy/host";
const uuid = z.uuid();
const token = z.string().regex(/^[a-f0-9]{64}$/);
const slotInput = z.object({ service: uuid, staff: uuid, day: z.iso.date() });
const input = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    quote: z.object({
      price_minor: z.number().int().nonnegative(),
      duration_minutes: z.number().int().positive(),
    }),
    service: uuid,
    staff: uuid,
    start: z.iso.datetime({ offset: true }),
    name: z.string().trim().min(2).max(80),
    email: z.email().max(254),
    token,
  }),
  z.object({ action: z.literal("view"), token }),
  z.object({
    action: z.enum(["cancel", "reschedule"]),
    token,
    version: z.number().int().positive(),
    start: z.iso.datetime({ offset: true }).optional(),
  }),
]);
const reply = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
function failure(error: { code: string; message: string }) {
  return reply(
    {
      error:
        error.code === "P0001"
          ? error.message
          : "We couldn’t save this appointment. Refresh availability and try again.",
    },
    409,
  );
}
export async function GET(request: NextRequest) {
  const parsed = slotInput.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  const host = normalizeHost(request.headers.get("host") ?? "");
  if (!parsed.success || !host)
    return reply({ error: "Choose a service, barber and valid date." }, 400);
  const { service, staff, day } = parsed.data;
  const { data, error } = await createPublicClient().rpc("booking_slots", {
    p_host: host,
    p_service: service,
    p_staff: staff,
    p_day: day,
  });
  return error ? failure(error) : reply(data);
}
export async function POST(request: NextRequest) {
  // Require the actual same origin; never trust forwarded-host or tenant IDs.
  const hostHeader = request.headers.get("host") ?? "";
  let origin: URL;
  try {
    origin = new URL(request.headers.get("origin") ?? "");
  } catch {
    return reply({ error: "Invalid request origin." }, 403);
  }
  if (
    origin.host !== hostHeader ||
    !["http:", "https:"].includes(origin.protocol)
  )
    return reply({ error: "Invalid request origin." }, 403);
  if (Number(request.headers.get("content-length")) > 4096)
    return reply({ error: "Request too large." }, 413);
  const body = await request.text();
  if (body.length > 4096) return reply({ error: "Request too large." }, 413);
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return reply({ error: "Invalid request." }, 400);
  }
  const parsed = input.safeParse(json);
  const host = normalizeHost(hostHeader);
  if (!parsed.success || !host)
    return reply({ error: "Check your booking details." }, 400);
  const value = parsed.data,
    db = createPublicClient();
  if (value.action === "create") {
    const { data, error } = await db.rpc("create_booking", {
      p_host: host,
      p_service: value.service,
      p_staff: value.staff,
      p_start: value.start,
      p_name: value.name,
      p_email: value.email,
      p_token: value.token,
      p_quote: value.quote,
    });
    return error ? failure(error) : reply({ id: data });
  }
  const { data, error } = await db.rpc("manage_booking", {
    p_host: host,
    p_token: value.token,
    p_action: value.action,
    ...(value.action !== "view"
      ? { p_version: value.version, p_start: value.start }
      : {}),
  });
  return error ? failure(error) : reply(data);
}
