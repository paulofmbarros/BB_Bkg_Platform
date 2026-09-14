# Barbershop OS

The approved V0 foundation, booking engine and first CRM increment: guest booking, a daily calendar, customer profiles and visit history. The app runs locally and in a private hosted staging environment with synthetic data. Payments are not connected.

## What works

- Platform client administration: barbershop creation, owner invitations, account suspension, access management and domain ownership verification. See [platform administration](docs/platform-administration.md) for local access and hosted setup.

- Supabase owner sign-in, sign-out and password recovery.
- Two isolated synthetic businesses: Porto Gentlemen and Atelier Lisboa.
- Owner / manager / staff permissions checked server-side and through PostgreSQL RLS.
- Service creation and editing, integer-cent prices, duration, buffers and visibility.
- Staff profiles, service assignments and individual weekly working hours.
- Business hours, lunch breaks, full-day closures and staff time off.
- Business branding, contact details, validated logo uploads and customer previews.
- Verified-host public catalogues. Unknown domains and tenant-domain management paths are rejected.
- Database audit events, health endpoint and feature entitlement enforcement.
- Mobile guest booking with database-derived slots, prices and double-booking protection.
- Private guest links for rescheduling/cancellation, plus an owner calendar and staff schedules.
- Completed/no-show recording and a small optional synthetic calendar dataset.
- Searchable customer profiles, contact edits, scoped visit history and completed-service totals.
- Reviewed duplicate-customer linking and undo, with audit history and unchanged consent.
- Owner/manager rebooking directly into an existing customer profile.
- Explainable customer segments with directory filters and profile-level reasons.
- A daily business brief with upcoming visits, outstanding outcomes and completed-service value clearly separated from collected revenue.

The overview reports actual configuration counts. It does not invent bookings, revenue or customer metrics.

## Run locally

Prerequisites: Node.js 22 and Docker Desktop running. Use the committed dependency lockfile.

```sh
npm ci
npm run setup:local
npm run dev:all
```

`setup:local` starts Supabase, creates the ignored local environment files when missing, and provisions the demo accounts and data. It is safe to rerun and refuses to seed a non-local database. `dev:all` starts Supabase, the local invitation function and Next.js together; press Ctrl+C once to stop the foreground services.

After the first setup, normal development only needs:

```sh
npm run dev:all
```

To debug server-side Next.js code, start the same stack with the Node inspector:

```sh
npm run dev:debug
```

In VS Code, open **Run and Debug**, select **Attach to Next.js server**, and press F5. Server actions, route handlers and Server Components can then stop on breakpoints. Use the browser's developer tools for client components.

`configure-local.mjs` reads local Supabase credentials into ignored `.env.local` and refuses to overwrite an existing file. The service-role key stays server-side and supports local provisioning, tests and authenticated platform support mode.

Open http://127.0.0.1:3000. In local development, **Open Porto Gentlemen demo** signs into a real local Supabase account. That shortcut is disabled outside development and on non-loopback hosts.

Public customer pages (Chromium resolves `.localhost` to the local machine):

- http://porto-gentlemen.localhost:3000
- http://atelier-lisboa.localhost:3000

The authenticated **View customer page** link is a read-only preview. Use **Calendar → New appointment** or the public shop’s **Book a visit** link for actual local bookings. Guest management links contain a private token after `#`; save the complete link, because this demo does not send booking emails.

Local-only accounts:

| Account                         | Password         | Access                          |
| ------------------------------- | ---------------- | ------------------------------- |
| owner@porto-gentlemen.example   | PortoDemo!2026   | Porto owner                     |
| manager@porto-gentlemen.example | ManagerDemo!2026 | Porto manager                   |
| staff@porto-gentlemen.example   | StaffDemo!2026   | Porto own schedule + foundation |
| owner@atelier-lisboa.example    | LisboaDemo!2026  | Independent Lisboa owner        |

Never provision these accounts into a hosted environment. The user seed refuses non-local Supabase URLs. All names, businesses, numbers and addresses are synthetic demo content; do not contact them.

Supabase Studio: http://127.0.0.1:54323. Choose **Table Editor** to browse rows or **SQL Editor** to query the local database. Local recovery emails are captured by Mailpit: http://127.0.0.1:54324. No real email provider is connected.

## Validation

```sh
npm run lint
npm run typecheck
npm test
npm run db:test
npx playwright install chromium
npm run test:e2e
npm run build
npx supabase db advisors --local --type security --level warn
```

`dev:all` includes the local invitation function. If Next.js is already running separately, you can instead run `npx supabase functions serve` in another terminal. See [platform administration](docs/platform-administration.md).

Run integration and browser tests sequentially: they intentionally edit and restore synthetic data. Integration tests refuse a non-local database. Browser tests use port 3000, the local demo accounts and the calendar/history/segment fixtures above.

To rebuild this disposable database from migrations (erases its current local data):

```sh
npm run db:reset
npm run demo:users
npm run demo:bookings
npm run demo:history
npm run demo:segments
```

## Repository

`src/app` contains thin Next.js routes. `src/modules` owns identity, tenancy, validation and business operations. `src/components` owns UI. Database constraints, atomic operations and policies live in `supabase/migrations`; reproducible business fixtures live in `supabase/seed.sql`. Generated database types are committed under `src/lib/supabase`.

Read [the architecture decisions](docs/architecture.md) and [the booking handoff](docs/phase-2.md) and [customer profile handoff](docs/phase-3-customers.md) before extending the system.

## Hosted pilot prerequisites

A protected synthetic staging deployment is available; see [staging access and verification](docs/staging.md). No paid plan upgrade has been performed. Use a separate EU Supabase project and Vercel Pro for a commercial pilot. Apply migrations without the synthetic seed; provision the owner and membership through a trusted administrative process. Configure `APP_ORIGIN` to the central HTTPS workspace, the publishable Supabase settings, recovery redirect allowlist, transactional SMTP, backup/restore procedures, monitoring and verified tenant domains. Never deploy the local `.env.local` or use localhost domain entries for a live tenant.

The Next.js runtime needs the environment's service-role credential for the authenticated, server-only platform support path. It must never be exposed to browser code. Public booking is enabled only for fictional demo tenants. Before enabling it for a live shop, add verified email delivery/recovery, production abuse protection, reviewed booking/privacy policies, and the remaining release checks in `docs/phase-2.md`. Payments remain unimplemented.

## Continuous delivery

See [the GitHub delivery workflow](docs/delivery.md) for PR checks, automatic staging deployments, protected production releases and required environment settings.
