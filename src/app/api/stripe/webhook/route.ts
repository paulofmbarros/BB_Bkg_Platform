import { createSupportClient } from "@/lib/supabase/server";
import { validStripeSignature } from "@/modules/revenue-protection/stripe";

type StripeEvent = {
  type: string;
  data: {
    object: {
      id: string;
      payment_intent?: string | { id?: string } | null;
      amount_refunded?: number;
      refunds?: { data?: Array<{ id?: string }> };
    };
  };
};

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature") ?? "";
  const payload = await request.text();
  if (!secret || !validStripeSignature(payload, signature, secret))
    return Response.json({ error: "Invalid signature." }, { status: 400 });

  let event: StripeEvent;
  try {
    event = JSON.parse(payload) as StripeEvent;
  } catch {
    return Response.json({ error: "Invalid payload." }, { status: 400 });
  }
  const object = event.data.object;
  const db = createSupportClient();
  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const intent =
      typeof object.payment_intent === "string"
        ? object.payment_intent
        : object.payment_intent?.id;
    const { error } = await db.rpc("finalize_stripe_deposit", {
      p_session: object.id,
      p_payment_intent: intent ?? (null as unknown as string),
      p_paid: true,
    });
    if (error)
      return Response.json({ error: "Update failed." }, { status: 500 });
  } else if (
    event.type === "checkout.session.expired" ||
    event.type === "checkout.session.async_payment_failed"
  ) {
    const { error } = await db.rpc("finalize_stripe_deposit", {
      p_session: object.id,
      p_payment_intent: null as unknown as string,
      p_paid: false,
    });
    if (error)
      return Response.json({ error: "Update failed." }, { status: 500 });
  } else if (event.type === "charge.refunded" && object.payment_intent) {
    const intent =
      typeof object.payment_intent === "string"
        ? object.payment_intent
        : object.payment_intent.id;
    if (intent) {
      const { error } = await db.rpc("finalize_stripe_refund", {
        p_payment_intent: intent,
        p_refund: object.refunds?.data?.at(-1)?.id ?? "stripe_webhook",
        p_amount: object.amount_refunded ?? 0,
      });
      if (error)
        return Response.json({ error: "Update failed." }, { status: 500 });
    }
  }
  return Response.json({ received: true });
}
