# Phase 2 handoff · Booking and calendar

## What is implemented

- A mobile guest flow: service → assigned barber → available date/time → minimal contact details → confirmation.
- Authoritative availability, price checks, duration/buffer snapshots and an exclusion constraint preventing overlaps.
- Private guest management links with reload support, cancellation and rescheduling.
- A daily owner/manager calendar with barber/date filters, creation via the shop flow, rescheduling, cancellation, completion and no-show recording.
- Staff access limited to their own appointments and related customers.
- Separate booking entitlement, audit events, creation retry protection and optimistic version checks.
- An optional 12-appointment fictional calendar fixture over three open days. The fixture respects current availability, skips conflicts and preserves existing appointments when rerun.

Everything is stored in the existing local Supabase/PostgreSQL Docker stack. This phase adds no hosted resources or external messages.

## Walkthrough

1. Open `http://127.0.0.1:3000`, enter the Porto Gentlemen demo and choose **Calendar**.
2. Explore today and the following open days. **New appointment** opens the actual branded booking page.
3. Alternatively visit `http://porto-gentlemen.localhost:3000/book`. Choose a service, barber and open date; use fictional contact details.
4. Confirm and save the complete private link. Reload it to see the persisted appointment.
5. Reschedule from that page or from the owner calendar, then cancel to release the time.
6. Sign in as the staff demo account to see only Rafael’s appointments.

Run `npm run demo:bookings` to populate the small calendar fixture after a fresh database setup. This does not reset existing data. It is separate from the later six-month CRM/analytics dataset.

## Deliberate limits and technical debt

- One location, one service, one barber per booking; Europe/Lisbon, EUR; no overnight shifts. Slots are every 15 minutes, 30 minutes to 90 days ahead.
- Free cancellation/rescheduling until the appointment starts. Policies are fixed in this increment; no deposits, fees, refunds or payment confirmation. “Completed” records attendance, not payment.
- Calendar is a daily agenda, without drag/drop or live push updates. Reload to see another user's changes. Updates reject stale versions.
- Email is unverified; guest bookings do not merge existing customer histories by address. The guest capability proves possession of the link, not email identity. Link recovery, expiry/rotation, verified delivery and customer deduplication remain work for a live pilot.
- Changing opening hours or adding leave does not silently cancel existing appointments. Review the calendar before those changes. Rescheduling after a service duration/buffer change requires the shop's assistance.
- Basic database abuse caps are present; public booking remains enabled only for synthetic tenants. Stronger trusted-edge limits and challenge verification are prerequisites to a real launch.
- Customer exports/erasure and reviewed retention policies remain part of subsequent customer/privacy work. No legal compliance claim is made.

## Verification

Validated on 12 September 2026: 27 unit/integration tests, 16 database assertions and all 12 browser tests pass. Production build, TypeScript, lint and formatting checks pass; the Supabase security advisor reports no warnings or errors. All eight migrations are applied locally. Existing local data was preserved; 12 synthetic calendar appointments were added. Automated accessibility results supplement visual inspection and are not a compliance certification.

Critical coverage includes booking races, direct overlap rejection including buffers, stale availability after closures, quote changes, idempotent retries, cancellation release, stale versions, status transitions, entitlement revocation, cross-tenant capabilities, staff/customer isolation, spring and autumn DST transitions, and browser origin checks. Browser tests cover mobile booking, persisted confirmation, owner rescheduling and guest cancellation; automated accessibility checks cover the new booking form/calendar alongside the existing screens.

## Next smallest valuable increment

Customer profiles and visit history, with a deliberate identity-resolution workflow for unverified guest records. Build trustworthy visit totals and explainable segmentation before adding revenue or retention dashboards.
