-- Only one open Stripe checkout can exist per appointment. Failed or expired
-- sessions release the constraint for a new attempt.
create unique index appointment_one_pending_stripe_checkout
  on public.appointment_deposit_payments(tenant_id,appointment_id)
  where provider='stripe' and status='pending';
