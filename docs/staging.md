# Private staging deployment

Status: deployment prepared; hosting sign-in and project provisioning are still pending. No cloud database or deployment has been created. Local data stays in the local Docker database.

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
| `LOCAL_DEMO`                           | `false`                                |

Do not copy `.env.local`. No service-role key, database password or management access token belongs in Vercel. The deployment build runs `scripts/check-hosted-env.mjs` first and reports configuration problems without printing credentials. `.vercelignore` excludes local environment files and generated output from CLI uploads. These checks do not validate account permissions, deployment protection or database migrations.

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
