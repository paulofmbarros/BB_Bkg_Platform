import { type NextRequest } from "next/server";
import { z } from "zod";
import { createPublicClient, createSupportClient } from "@/lib/supabase/server";
import { normalizeHost } from "@/modules/tenancy/host";

const input = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) });
const detailsSchema = z.object({
  appointment_id: z.uuid(),
  customer_email: z.email(),
  business_name: z.string(),
  is_demo: z.boolean(),
  service_name: z.string(),
  starts_at: z.string(),
  appointment_status: z.string(),
  deposit_required_minor: z.number().int().nonnegative(),
  deposit_paid_minor: z.number().int().nonnegative(),
  pending_session: z.string().nullable(),
});

const reply = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
    },
  });

async function stripeRequest(path: string, secret: string, init?: RequestInit) {
  return fetch(`https://api.stripe.com/v1/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret}`,
      ...(init?.headers ?? {}),
    },
  });
}

export async function POST(request: NextRequest) {
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
  if (Number(request.headers.get("content-length")) > 1024)
    return reply({ error: "Request too large." }, 413);

  const parsed = input.safeParse(await request.json().catch(() => null));
  const host = normalizeHost(hostHeader);
  if (!parsed.success || !host)
    return reply({ error: "Check your booking details." }, 400);

  const db = createPublicClient();
  const response = await db.rpc("booking_deposit_details", {
    p_host: host,
    p_token: parsed.data.token,
  });
  const details = detailsSchema.safeParse(response.data);
  if (response.error || !details.success)
    return reply({ error: "Booking not found." }, 404);
  if (details.data.is_demo)
    return reply(
      { error: "Payments are disabled for this fictional shop." },
      409,
    );
  if (
    details.data.appointment_status !== "confirmed" ||
    new Date(details.data.starts_at) <= new Date()
  )
    return reply({ error: "This appointment cannot accept a deposit." }, 409);
  const remaining =
    details.data.deposit_required_minor - details.data.deposit_paid_minor;
  if (remaining <= 0)
    return reply({ error: "The deposit is already paid." }, 409);

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret)
    return reply({ error: "Online deposit payments are not configured." }, 503);

  if (details.data.pending_session) {
    const existing = await stripeRequest(
      `checkout/sessions/${encodeURIComponent(details.data.pending_session)}`,
      secret,
    );
    if (existing.ok) {
      const session = (await existing.json()) as {
        status?: string;
        url?: string;
      };
      if (session.status === "open" && session.url)
        return reply({ url: session.url });
    }
    await createSupportClient().rpc("finalize_stripe_deposit", {
      p_session: details.data.pending_session,
      p_payment_intent: null as unknown as string,
      p_paid: false,
    });
  }

  const returnUrl = `${origin.origin}/manage#${parsed.data.token}`;
  const body = new URLSearchParams({
    mode: "payment",
    success_url: returnUrl,
    cancel_url: returnUrl,
    customer_email: details.data.customer_email,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "eur",
    "line_items[0][price_data][unit_amount]": String(remaining),
    "line_items[0][price_data][product_data][name]": `Deposit · ${details.data.service_name}`,
    "metadata[appointment_id]": details.data.appointment_id,
    "metadata[source]": "noma_revenue_protection",
    "payment_intent_data[metadata][appointment_id]":
      details.data.appointment_id,
    "payment_intent_data[metadata][source]": "noma_revenue_protection",
  });
  const checkoutResponse = await stripeRequest("checkout/sessions", secret, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const checkout = (await checkoutResponse.json()) as {
    id?: string;
    url?: string;
    error?: { message?: string };
  };
  if (!checkoutResponse.ok || !checkout.id || !checkout.url)
    return reply(
      {
        error:
          checkout.error?.message ?? "The payment page could not be opened.",
      },
      502,
    );
  const registration = await db.rpc("register_stripe_deposit_checkout", {
    p_host: host,
    p_token: parsed.data.token,
    p_session: checkout.id,
  });
  if (registration.error)
    return reply({ error: "The payment page could not be opened." }, 409);
  return reply({ url: checkout.url });
}
