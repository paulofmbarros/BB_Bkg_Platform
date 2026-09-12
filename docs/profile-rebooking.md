# Rebooking from a customer profile

Owners and managers can choose **Book next visit** on a customer profile, select a service/barber/time, and book directly into that customer's existing history. No duplicate customer is created.

The last completed visit supplies the suggested service and barber where they are still active and assigned. Current prices and duration are displayed and checked again by the database. Customers with existing upcoming appointments see a warning and a link to review them first.

## Authorization and integrity

The private transaction validates management permission, the active tenant, booking entitlement, customer ownership and profile version. Linked source records cannot receive new bookings: use the retained profile. After acquiring the shared scheduling lock, authorization is checked again. Availability follows the existing hours, leave, breaks, buffer, lead-time and horizon rules; the exclusion constraint remains the final overlap safeguard.

A tenant-scoped request ID and fingerprint make identical retries return the original appointment. Changed details cannot reuse that request ID. The request ID grants no guest access and is not a management token. No contact, verification or marketing fields are changed. Appointments enter as confirmed and unpaid, with the normal audit event.

Authenticated availability no longer depends on a public verified domain. The owner booking/rescheduling picker uses a narrow manager-only availability function, enforcing tenant and booking entitlement checks.

## Walkthrough and limits

Open a customer profile, choose **Book next visit**, select an available date/time and confirm. The new visit appears in the profile's upcoming history and the calendar; completed visit/value totals do not increase until the visit is marked completed.

This is an owner/manager workflow. Staff and anonymous callers cannot use it. No email, payment or guest management link is sent or issued; changes are managed through the calendar. Public guest booking still creates a separate guest record, which can later be reviewed and linked. Customer self-service repeat booking requires verified access in a future increment.

The follow-up [customer segmentation increment](customer-segments.md) is now implemented.

## Verification · 12 September 2026

37 unit/integration tests, 19 database assertions and 17 browser tests pass. Rebooking coverage includes permissions, tenant boundaries, revoked entitlement, stale profile/quote checks, concurrent retry safety, occupied slots, unchanged customer counts, and a mobile booking into existing visit history. The production build, TypeScript, lint and formatting checks pass; the security advisor reports no warnings or errors. The rebooking screen passed automated accessibility checks and visual inspection. Test appointments were removed after verification.
