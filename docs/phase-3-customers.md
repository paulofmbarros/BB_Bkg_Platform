# Customer profiles and visit history

This increment adds a searchable customer directory and individual profiles, with complete paginated appointment history. It builds on the Phase 2 booking records and keeps the existing local data.

## What works

- **Customers** navigation, name/email search and 20-record pagination.
- Customer contact details, email verification state and marketing preference display.
- Owner/manager contact edits with authorization, input validation, audit events and version checks. Editing an email never verifies it or opts a customer into marketing.
- Completed visits, completed service value, average completed visit, last completed visit and next scheduled visit.
- Upcoming/cancelled/no-show counts and an explicit indication of past or ongoing appointments awaiting an outcome.
- Filtered appointment history showing the quoted service name/price, barber, date and status, linked back to the calendar. Calendar customer names link to profiles.
- Staff profiles and totals include only appointments assigned to their linked staff identity. Owner/manager totals span their business.
- Duplicate-email notices link to matching records without joining histories or granting identity access.

The summary view is a PostgreSQL `security_invoker` view: existing customer/appointment RLS applies before aggregation. Summary calculations operate over all authorized appointments, independently of the 20-row history pagination. Directory search treats `%`, `_` and backslashes as literal characters.

## Demo

After the normal local seed setup, run:

```sh
npm run demo:bookings
npm run demo:history
```

The history fixture adds up to 32 fictional appointments across eight existing demo customers over roughly four months. It respects configured historical availability, skips conflicting slots, preserves existing appointments, and is safe to rerun. It is deliberately smaller than the later full six-month analytics dataset.

Open `http://127.0.0.1:3000/workspace/porto-gentlemen/customers`. Miguel Santos is an example with repeat visits; other profiles demonstrate cancellation/no-show histories. The staff demo account sees only its own customer relationships.

## Intentional limits

Completed service value is the sum of quoted prices on completed appointments. It is not revenue collected; payment execution, refunds and accounting are not implemented. Cancelled, no-show, upcoming and unresolved visits do not contribute to these value totals.

Guest email addresses remain unverified. Each new guest booking currently creates its own customer record. Matching email addresses are not enough to combine records safely; the profile points out potential matches for review. Reviewed linking and undo are now available; see `customer-linking.md`. Authenticated repeat booking, notes, exports/erasure and retention workflows remain unimplemented. No marketing messages are sent and no subscriptions are changed.

The current history preserves service/price snapshots but displays the staff profile's current name. Customer records without appointments are visible to managers, not staff. This increment introduces no hosted infrastructure or privileged runtime key.

## Next smallest increment

Reviewed identity linking is now implemented. Owner/manager repeat booking is also implemented; see `profile-rebooking.md`. Explainable segmentation is next.

## Verification · 12 September 2026

31 unit/integration tests, 19 database assertions and 15 browser tests pass. Production build, TypeScript, lint and formatting checks pass. The Supabase security advisor reports no warnings or errors. Browser checks include customer search/pagination, history filters, persisted contact edits, calendar links, staff restrictions, mobile overflow and automated accessibility checks. Desktop/mobile profile screenshots were visually inspected. Existing local data was retained and the 32-appointment history fixture was added.
