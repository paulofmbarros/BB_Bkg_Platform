# Explainable customer segments

Owners and managers can filter the customer directory by segment and open a profile to see why it received its label. Counts cover all matching customers before pagination; text search and segment filters work together. Staff retain their scoped customer history without shop-wide segments.

## Rules and precedence

The first applicable rule wins:

1. **Needs review:** an unresolved past or ongoing appointment, another active profile using the same email, or a completed visit dated in the future.
2. **New:** no completed visits.
3. **Inactive:** at least 120 calendar days since the last completed visit and no future confirmed appointment.
4. **At risk:** at least 60 calendar days since the last completed visit and no future confirmed appointment.
5. **Regular:** three or more completed visits.
6. **Returning:** two completed visits.
7. **New:** one completed visit.

Recency uses the database clock and Europe/Lisbon calendar dates. An upcoming booking suppresses At risk and Inactive, but does not override Needs review. Cancelled and no-show appointments do not count as completed visits. Linked source records are excluded; retained profiles use the reviewed combined history.

## Interpretation and limits

These fixed thresholds are initial operating defaults, not predictions or a learned customer score. Shops cannot configure them yet. Labels describe the recorded history, which may be incomplete. Matching email prompts review; it does not prove that profiles represent the same person. Separate records with different emails can still represent one customer. No automatic linking, marketing permission, outreach, discounts or payments are introduced.

The view and count function execute with caller privileges and enforce tenant isolation. Managers see their tenant; staff, other tenants and anonymous callers cannot retrieve these segments. Labels are computed on read rather than stored as stale customer attributes.

## Local walkthrough

After the existing demo setup, run `npm run demo:segments` to add two synthetic historical profiles without resetting existing data. Sign in as Porto owner, open Customers, and choose At risk for Filipe Monteiro or Inactive for Eduardo Correia. Open either profile to inspect the reason and expand How customer segments work. These time-relative fixtures are local demonstration data.

The follow-up daily business brief is now implemented; see [daily-business-brief.md](daily-business-brief.md).

## Verification · 12 September 2026

All 88 checks pass: 39 unit/integration tests, 31 database assertions and 18 browser tests. Coverage includes exact segment boundaries, precedence, upcoming-booking suppression, duplicate review, tenant and role isolation, directory filtering and profile explanations. Mobile layout and automated WCAG AA checks pass. The production build, TypeScript, lint and formatting checks pass; the local database security advisor reports no warnings or errors.
