# Phase 1 handoff

Scope: tenant isolation, white-label foundation, owner authentication, service/staff management and weekly availability configuration.

## Verification completed — 12 September 2026

- Production build, TypeScript, lint and formatting checks pass.
- 18 unit/integration tests pass against local PostgreSQL and Supabase Auth.
- 7 database assertions pass, including RLS coverage and restricted grants.
- 10 browser tests pass, including persistent service/staff/hour edits, two public tenant domains, mobile layout, logo validation and email password recovery.
- Automated WCAG A/AA checks pass for the overview, services, hours and customer preview. These checks supplement visual and keyboard review; they are not a compliance certification.
- The database was rebuilt successfully from all three committed-to-disk migrations and synthetic seeds; tests passed again afterward.
- Supabase security advisors reported no warnings or errors. Local secrets and build dependencies are excluded from Git.

The development server and local Supabase stack remain running. No hosted deployment or paid infrastructure was created.

## Walkthrough

1. Open the local app and enter the Porto Gentlemen demo.
2. Review real service/staff/open-hours counts and setup readiness.
3. Open Services; filter/search, edit a price, save and reload.
4. Open Team; edit a profile and assigned services; adjust working hours or add time off.
5. Open Opening hours; change a day or break and add a special closure.
6. Open Brand & business; change the tagline or colour and preview the customer page.
7. Visit the Porto and Lisboa public subdomains to verify separate brands/catalogues.
8. Sign in as the Lisboa owner and attempt a Porto workspace URL: no Porto content is returned.

## Not implemented in this increment

Appointments, booking concurrency, calendar, customer CRM, financial analytics, six-month appointment/customer fixtures, waitlist, deposits, Stripe, campaigns, PWA/offline behavior and production hosting are later phases. The customer page explicitly states that online booking is not open. The full synthetic historical dataset arrives with the relevant domain modules.

## Release limitations

This is a tested local foundation, not a production readiness certification. Before a live pilot: production owner provisioning, verified domains/TLS, recovery email delivery, MFA for sensitive owner actions, shared abuse limits for future public mutations, monitored error collection, a restore drill and privacy/retention review. Existing Supabase Auth rate limiting applies to login/recovery; custom public booking rate limits are not yet needed because public booking is not implemented.

## Next smallest valuable increment

Implement one-service/one-barber guest booking with server-derived price and availability, PostgreSQL exclusion-based double-booking protection, cancellation/rescheduling and an owner calendar. Add DST, race, stale-availability and cross-tenant booking tests before expanding into CRM or payments.
