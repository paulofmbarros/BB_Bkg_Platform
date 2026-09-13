# GitHub delivery workflow

Feature branches open pull requests into `main`. The required **Quality checks** job runs lint, formatting, unit/integration tests, database assertions, browser tests and a production build against a disposable local Supabase stack. Pull requests do not receive hosted credentials or deploy anything.

A merged PR into `main` triggers the Deploy workflow. It verifies that the triggering commit belongs to a merged PR, repeats validation for the merged code, builds using the staging Vercel settings, applies pending migrations to the staging database, and deploys the built application. A health request verifies database connectivity. Deployments are serialized per environment; active deployment jobs are not cancelled midway through migrations.

To release, open a PR from `main` into `production`. Other source branches are rejected. After review and merge, the same pipeline targets the GitHub `production` environment and waits for the configured deployment reviewer. After a production release, merge `production` back into `main` through a PR so the branches remain synchronized for the next release. Production settings must be enabled, distinct from staging, and have required environment reviewers. No production resources are provisioned by the workflow itself.

## GitHub environments

Each environment owns these variables:

| Variable               | Meaning                                    |
| ---------------------- | ------------------------------------------ |
| `DEPLOY_ENABLED`       | Must be `true`; production starts disabled |
| `SUPABASE_PROJECT_REF` | Database project for this environment      |
| `VERCEL_PROJECT_ID`    | Dedicated Vercel project                   |
| `VERCEL_ORG_ID`        | Owning Vercel team                         |
| `APP_ORIGIN`           | Stable HTTPS workspace address             |

Each environment owns two encrypted secrets: `SUPABASE_ACCESS_TOKEN` for migrations and `VERCEL_TOKEN` for building/deploying its Vercel project. Never use repository-wide production secrets. The Vercel staging token is scoped to `paulo-s-team1` and expires 11 December 2026; replace it before expiry. Team scope is required by the current [Vercel CLI project-token limitation](https://github.com/vercel/vercel/issues/17506), and grants access to every project in that team. It is stored only in GitHub's staging environment. Use a separate production token and consider a separate Vercel team for credential isolation. Limit Supabase management access as far as the provider supports and rotate it when membership or access changes.

The Supabase management credential is used for migrations and deploying/configuring the owner invitation Edge Function. It is not sent to Vercel or loaded into the application build. Vercel settings are checked against the selected database and workspace before migrations. The Next.js runtime uses the publishable key and a server-only service-role key for platform support mode. The support client is constructed only after the caller's session passes the active platform-administrator check. The separate invitation function uses Supabase's built-in privileged credentials after the same role check; see `platform-administration.md` for required runtime, Auth redirect and email settings.

Staging permits deployments only from `main`; production only from `production`. Production uses `paulofmbarros` as its environment approver. GitHub allows this reviewer to approve a deployment they initiated. Production PR approval is separate: GitHub does not allow an author to approve their own PR, so a second collaborator must review a release authored by Paulo.

## Release protections and limits

Branch protections require passing Quality checks, resolved conversations and a PR; force pushes and branch deletion are denied, including for administrators. Production additionally requires one approving PR review and dismisses stale reviews. Main requires checks and a PR, with no mandatory independent review so solo development can proceed.

`vercel.json` disables Vercel's automatic Git deployments. GitHub Actions is the deployment authority. Its `--prod` flag selects the stable alias within the chosen Vercel project; it does not turn the dedicated staging project into the real production environment.

Production remains disabled until a separate database, Vercel project, domain, environment secrets and application settings are provisioned and verified. The production branch initially contains the already-deployed application baseline, not a live production release. Complete the customer-facing release prerequisites in `staging.md` before enabling real bookings.

Deployments apply migrations without seed data or resets. Make migrations compatible with the currently deployed application: the database changes before the new app is published. If a deployment fails after migrations, do not reset the database; repair forward or use a reviewed recovery plan. Rolling back Vercel does not roll back the schema.

Bootstrap configuration and the first staging pipeline run are tracked in the implementation PR. Do not treat committed workflow files alone as proof that deployment credentials or protections are active.
