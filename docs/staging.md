# Private staging deployment

Status: private staging deployed and verified on 12 September 2026. The local Docker database remains separate and unchanged.

## Target

Use a dedicated Vercel project named `barbershop-os-staging` and a separate Supabase project in the EU, preferably Frankfurt to match the configured Vercel function region. Confirm the actual organization, plan and costs in the hosting accounts before provisioning. Use synthetic shop records and newly provisioned reviewer accounts with unique passwords. Never run the local account seed against a hosted project or copy local authentication data.

The application needs a stable central workspace hostname (`APP_ORIGIN`) and at least one separate shop hostname. Attach both to the staging Vercel project; register only the shop hostname in `tenant_domains` after ownership is verified. Random preview URLs are not automatically trusted workspace or shop hosts. Use exact HTTPS recovery callback URLs in Supabase Auth. Localhost fixture domains must not be carried into staging.

## Application environment

Set these values in Vercel for the environment used by this dedicated staging project:

| Variable                               | Value                                  |
| -------------------------------------- | -------------------------------------- |
| `APP_ORIGIN`                           | Stable HTTPS workspace origin, no path |
| `NEXT_PUBLIC_SUPABASE_URL`             | New staging Supabase project URL       |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | That project's `sb_publishable_…` key  |
| `SUPABASE_SERVICE_ROLE_KEY`            | Server-only support-mode credential    |
| `LOCAL_DEMO`                           | `false`                                |

Do not copy `.env.local`. Set only the staging project's service-role key for the authenticated server-side support path. Database passwords, management access tokens, JWT secrets and connection strings do not belong in Vercel. The deployment build runs `scripts/check-hosted-env.mjs` first and reports configuration problems without printing credentials. `.vercelignore` excludes local environment files and generated output from CLI uploads. These checks do not validate account permissions, deployment protection or database migrations.

## Provisioning order

1. Authenticate to Vercel and Supabase, select the intended accounts, and confirm available project capacity and any cost.
2. Create an isolated staging database. Apply the committed migrations in order, with no local seed, no reset and no production database connection. Provision synthetic tenant catalogue data separately, omitting localhost domains. Provision reviewers through trusted Supabase administration and assign explicit memberships.
3. Create the dedicated Vercel project. Require authentication for **all deployments and attached domains**, including its production alias. Verify protection before adding data or sharing the address; do not assume preview-only protection covers the stable domain.
4. Configure Node.js 22, the application environment, workspace/shop hostnames and Supabase Auth settings. The repository's Vercel configuration uses the lockfile and Frankfurt functions. Disable public account registration for invitation-only staging. Configure recovery email delivery separately when testing recovery.
5. Deploy the committed application. Enable booking only for the synthetic staging tenant. Do not enable real customer bookings.
6. Validate the protected deployment with an authorized reviewer. An unauthenticated external browser must encounter hosting protection on workspace and shop URLs. After hosting authentication, verify application login, tenant isolation, service data, customer history and segment explanations. Check booking, rescheduling and cancellation with synthetic data across the shop hostname. Confirm secure cookies, HTTPS recovery redirects, mobile layout and `/api/health` database connectivity.
7. Record the deployed commit, project identifiers, region, protected URLs, applied migrations and verification results here. Never record credentials or guest management tokens.

The existing automated integration and browser suites are deliberately local-only and must remain so. Do not redirect them at hosted staging. Use isolated hosted smoke scenarios instead.

## Rollback and release boundary

Keep the previous successful Vercel deployment available for application rollback. Schema changes need their own compatibility review and database recovery plan; redeploying old code does not undo migrations. No database reset is part of deployment.

Before a live pilot, finish booking email delivery and secure link recovery, stronger public abuse controls, backup restoration verification, monitoring, and reviewed customer retention/deletion and booking policies. Staging is for invited reviewers and synthetic data only.

References: [Vercel configuration](https://vercel.com/docs/project-configuration/vercel-json), [deployment protection](https://vercel.com/docs/deployment-protection), and [Supabase environments](https://supabase.com/docs/guides/deployment/managing-environments).

## Deployment record · 12 September 2026

- Application commit: `e84995d`; Vercel deployment `dpl_5SD9e38EqtC6TR1uvEofYSBjz3U1`.
- Vercel: `paulo-s-team1/barbershop-os-staging`, project `prj_BUOlUKCaZf8kTgA9PEkzO8TZKxfb`. Node.js 22; functions configured for Frankfurt. The build itself ran in Vercel's US build region.
- Supabase: `atliuoyvxnpetqhwfakm`, organization `BB_Booking_System`, Ireland (`eu-west-1`). This pre-existing empty project was used as the separate staging database; no production data was imported.
- Workspace: https://barbershop-os-staging.vercel.app
- Shop booking: https://porto-gentlemen-staging.vercel.app/book
- All 13 migrations applied through the CLI, with migration history preserved. Two synthetic shops were provisioned; only Porto has a hosted shop domain. Calendar, history and segment fixtures were added separately.
- Three unique staging reviewer accounts were created without sending email. Owner access details are in the ignored local `.vercel/staging-access.md`; no credentials are committed.
- Vercel authentication protects all deployments and aliases. Both stable domains redirect unauthenticated requests to Vercel SSO. Public account registration is disabled; the recovery callback is restricted to the workspace HTTPS address.
- The Supabase integration initially injected several privileged credentials into Vercel. Its secret, JWT and database-password/connection variables were removed before the successful build. Platform support mode now requires only the service-role key to be restored as an explicit server-only variable; the build guard continues to reject the other credentials.
- Hosted clean install and production build pass. The lockfile was repaired under Linux/Node.js 22 to include two missing optional dependencies. Five configuration tests, TypeScript, lint and formatting checks pass.
- Hosted checks passed for database health, three reviewer logins, tenant/role isolation, anonymous customer isolation, shop catalogue, booking, private receipt, rescheduling and cancellation. The temporary smoke appointment and contact were removed. Browser checks confirmed owner sign-in, customer segments and the shop booking form.
- One hosted security-advisor warning remains: leaked-password protection is disabled. Email delivery/recovery and a full hosted mobile/accessibility regression were not tested. The existing 88-check local regression passed before deployment preparation.
- No paid plan upgrade, Git push or automatic Git deployment connection was performed. The app is deployed to the dedicated staging project's stable alias; Vercel calls that target “production,” but it remains a protected synthetic demo. Current plans are Vercel Hobby and Supabase Free; review commercial plan requirements before a business pilot.
