# Retention health and attributable outreach

Owners and managers can now understand a customer’s return health, record explicit email-marketing consent, log rebooking outreach and attribute a resulting owner-booked appointment to that outreach. Noma does not send the message in this increment; the owner confirms that it was sent through an approved business email channel.

## Retention health

The customer profile explains one of these deterministic states:

- **Needs review:** unresolved history or identity data must be fixed first.
- **Next visit booked:** a future confirmed appointment already exists.
- **Past usual return time / Due soon / On track:** at least three distinct completed visit days establish a median return interval.
- **At risk / Inactive:** the fixed 60- and 120-day rules apply when there is not enough consistent history for an individual cadence.
- **Building history:** more completed visit days are required.

The explanation shows the completed visit-day count, median interval and timing where available. It is not a predictive score or permission to contact the customer.

## Consent evidence

Marketing remains off by default. An owner or manager must record that the customer directly requested an email opt-in before outreach can be recorded. Opt-outs use the same explicit workflow, take effect immediately and remain in an append-only consent-event history. Appointment contact details and an existing customer relationship do not imply marketing consent.

Consent changes use a locked, version-checked database function. Staff, anonymous callers, other tenants and platform support mode cannot perform them. Linking customer records continues to preserve the retained profile’s consent rather than combining consent states.

## Outreach and attribution

The rebooking-opportunity screen provides suggested copy only for an eligible, opted-in customer. After sending it externally, the owner records the exact message and confirms the channel. The database rechecks current consent and opportunity eligibility, stores the consent event used, and prevents another unattributed rebooking outreach for seven days.

An unconverted outreach can be carried into the existing profile-rebooking flow for 30 days. Booking and attribution occur in one transaction and share the existing idempotency key, so retries cannot create duplicate appointments or double attribution. The opportunity screen and customer profile show recorded actions and attributed appointments.

“Attributed service value” is the booked appointment price. It measures an influenced booking, not payment, collection or recovered revenue. Cancellation does not erase the historical attribution; outcome reporting can distinguish booking from completed service later.

## Verification

Unit coverage verifies explanation and message language. Database assertions cover the security-invoker view, narrow mutation functions, RLS and one-to-one attribution. Integration coverage verifies health cadence, role and tenant boundaries, explicit opt-in, duplicate-outreach prevention, idempotent booking and attribution totals.
