# Revenue protection

Owners and managers can configure transparent deposit, refund and reminder rules, see the attendance history behind each risk tier, and track a conservative protected-value ledger. The workflow is implemented for pilot evaluation; the roadmap evidence gate still requires real-world proof that it reduces loss.

## Policy snapshots

Each new appointment receives an immutable snapshot of the active revenue-protection policy. The snapshot records the deposit rule and percentage, cancellation deadline, reminder time, attendance counts and resulting risk tier. Later policy edits affect new appointments only. Rescheduling moves the snapshotted cancellation and reminder deadlines with the appointment, while retaining the originally agreed percentages and windows.

The owner can choose no deposits, deposits for elevated/high risk only, or deposits for every appointment. Existing appointments were backfilled with risk evidence but no retroactive deposit requirement.

## Explainable attendance risk

The classifier is deterministic and uses only prior appointment outcomes:

- **Standard:** no no-shows, unless a sparse history contains repeated cancellations.
- **Elevated:** one prior no-show, or at least two cancellations with fewer than two completed visits.
- **High:** at least two prior no-shows, or a no-show before any completed visit.

The owner sees the underlying completed, cancelled and no-show counts. The system does not use an opaque score, protected characteristic, contact detail or inferred personal attribute.

## Deposits and refunds

Stripe Checkout is available when both `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are configured. Checkout uses the Stripe account's eligible payment methods, so locally appropriate methods are enabled and reviewed in Stripe rather than hard-coded by Noma. Card or bank credentials never pass through or persist in the application. Signed webhooks finalize payment and refund evidence; replayed events and concurrent checkout attempts cannot double-count a deposit.

For an operational pilot or the fictional demo, a manager can explicitly record a deposit received outside Stripe. The fictional shop never opens a real payment page. An eligible early cancellation becomes **refund due**; the manager completes the refund from the action queue. Stripe refunds are idempotent, and manual refunds retain their own audit evidence.

The public booking flow shows the possible deposit percentage and refund window before confirmation. The private booking receipt shows the exact required amount, payment state and timestamped refund deadline.

## Reminders

The action queue identifies appointments whose snapshotted reminder time has arrived. Until transactional email delivery is implemented, Noma does not send the reminder: the manager must confirm it was sent through an approved channel, and Noma records that evidence. This distinction is explicit in the UI and reporting.

## Reporting definition

**Protected value** counts only the unrefunded portion of a paid deposit retained after a no-show or a cancellation after the refund deadline. It excludes pending deposits, refundable deposits, refunded money, appointment prices, completed-service value and forecast revenue. Deposits secured and refunds due are displayed separately and are not added to protected value.

## Security and operations

Policy changes, manual payment evidence, reminder evidence and refunds run through tenant-scoped database transactions. Staff, anonymous callers, other tenants and platform support mode cannot read or mutate the owner dashboard. A guest capability can see and pay only its appointment's deposit. Stripe finalization functions accept only the server-side service role after webhook signature verification.

Before a live pilot, configure a dedicated Stripe account and signed webhook endpoint, test the enabled Portuguese payment methods and refund behavior, complete transactional reminder delivery, review the policy wording with counsel, and monitor failed or duplicate payment events. No claim of legal compliance or proven loss reduction is made.

## Verification

Unit coverage verifies risk rules, localized explanations and Stripe webhook signatures. Database assertions verify the table and function privilege boundaries. Integration coverage verifies tenant isolation, policy snapshots, history-based deposits, payments, refunds, reminders and protected-value calculations. Browser coverage runs the owner policy → customer booking → manual deposit → early cancellation → refund workflow against local Supabase.
