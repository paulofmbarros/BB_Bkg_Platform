# Revenue recovery

Owners and managers can keep a consent-aware waitlist, see which future cancellations match those requests, record an external customer contact and book an accepted offer into the exact released time. The workflow provides attributable evidence for pilot evaluation; it does not prove that the capacity would otherwise have remained empty.

## Waitlist and matching

A waitlist request uses an existing retained customer profile, one active service, a date window within the next 90 days and an optional preferred team member. The customer must have current marketing consent backed by a recorded consent event. Withdrawing consent immediately removes the request from the match queue even though its audit history remains.

Matches are deterministic and explainable. A future cancelled appointment appears when its service and local date match the request and its staff member matches the optional preference. The released interval disappears when any non-cancelled appointment overlaps it. Noma does not use an opaque score, inferred customer preference or financial characteristic.

## Contact and booking attribution

Noma prepares a message, but it does not send it. A manager must contact the customer through an approved external email channel and confirm the exact message sent. The recovery action preserves the consent evidence, cancelled source appointment, actor and timestamp.

After the customer accepts the exact time, the manager confirms that acceptance. The database reuses the existing tenant scheduling lock, current service price and duration, authoritative availability engine and idempotent owner-rebooking request. The new appointment is linked atomically to the recovery action and the waitlist request is closed as booked. If another booking has taken any part of the released interval, confirmation fails safely.

## Reporting definition

The dashboard separates:

- **Booked service value:** the current quoted value of appointments attributed to a waitlist recovery action. It is not collected revenue.
- **Completed recovered value:** the quoted value of those attributed appointments only after they are marked completed. It remains service value rather than payment evidence.

Cancelled or no-show recovery bookings do not count as completed recovered value. Open matches and recorded contacts are operational counts, not revenue.

## Security and deliberate limits

Waitlist rows, recovery actions, opportunities and summary reporting are manager-only and tenant-scoped through RLS and authorized database transactions. Staff, other tenants, anonymous callers and platform support mode cannot read or mutate the workflow. All waitlist and recovery evidence changes are audited.

This increment covers cancellations only. It does not yet detect never-booked empty capacity, rank multiple candidates, send notifications, accept a customer booking directly from a message, capture fine-grained weekday/time preferences or prove incremental lift. The manager chooses whom to contact when several customers match one released time; after the first booking, all other matches for that interval disappear.

Before a live pilot, connect transactional email with delivery and unsubscribe handling, review the meaning of marketing consent for waitlist notifications, add trusted-edge abuse controls, and define an experiment or counterfactual for claims that revenue was truly recovered.

## Verification

The integration workflow creates evidenced consent and a waitlist request, cancels a real future appointment, verifies deterministic matching and tenant/role isolation, records external contact evidence, books the exact released time and confirms idempotent attribution and conservative reporting. The browser accessibility regression includes the recovery dashboard. TypeScript, lint, the production build and the full unit/integration suite remain release checks.
