# Platform administration

The central workspace now has an administrator area at `/admin`. Platform operators sign in through the normal login page and land on the client directory. Shop owners, managers and staff cannot open it or call its database operations. Shop hostnames reject administration routes entirely.

## Managing a client

1. Choose **Add barbershop**. Enter the shop name, unique identifier, contact details and owner email. Creation atomically provisions its business, branding, single location, closed initial hours, foundation entitlement and pending owner invitation. Currency remains EUR and scheduling remains Europe/Lisbon.
2. Review the new client, then choose **Send invitation**. The owner receives an Auth email, accepts the invitation, sets a password and signs in. Existing accounts receive a magic link and can accept using their existing identity. A pending invitation does not grant access.
3. The owner adds services, barbers, service assignments, working hours and branding in their normal workspace. The platform client page tracks basic setup counts; it is not a replacement for testing actual availability.
4. Add a booking hostname. Attach it to the correct hosting project and configure DNS routing. Publish the displayed `_barbershop-os` TXT record and choose **Verify DNS record**. The server checks that record before registering ownership verification. This does not configure Vercel or purchase a domain.
5. Enable bookings when the environment has completed its release checks. Live booking is locked for non-demo shops until trusted administration sets `private.platform_release.live_booking_ready=true`. Complete the release prerequisites in `staging.md` before changing this gate. Do not enable it merely to make the checkbox available.

You can edit contact details, suspend/restore a shop, control its foundation and booking features, invite another owner, cancel a pending invitation, and revoke/restore individual memberships. Inviting another owner leaves existing owners in place. The last active owner cannot be revoked; invite their replacement first or suspend the shop. Suspension retains records and appointments while denying private tenant data access through existing sessions and disabling its public catalogue. Permanent deletion, subscription billing and automatic domain hosting configuration are outside this increment.

The client header can copy the owner workspace address for onboarding and support. A customer booking-page link appears after at least one booking hostname has verified ownership. Opening the owner address still requires an explicit shop membership; platform administration alone does not grant access to customer or appointment data.

Platform administration does not implicitly grant access to each shop's customers or calendar. It exposes account/setup metadata and membership contacts through narrow database functions. Regular workspace access still requires explicit membership.

## Local use

Apply pending migrations with `npx supabase migration up --local`, then run `npm run demo:users`. A separate local-only operator is available:

- Email: `platform@barbershop-os.example`
- Password: `PlatformDemo!2026`
- Login: `http://127.0.0.1:3000/login`

Never provision this synthetic account into a hosted environment. The seed script refuses non-local databases.

Start invitation delivery in another terminal:

```sh
cp supabase/functions/.env.example supabase/functions/.env
npx supabase functions serve
```

Keep the local database and `npm run dev` running. Emails are captured at `http://127.0.0.1:54324`; nothing is sent to real inboxes. Local Auth allows the `/accept-invite/*` redirect. If the database was already running before this configuration change, restart it without resetting its data.

## Hosted setup

Migrations and the invitation function are included in the existing reviewed deployment pipeline. Applying local code does not deploy it. Before using the feature in staging or production:

1. Apply the migration in the selected environment through the existing pipeline.
2. Provision a real operator account through trusted Supabase administration. Grant platform access to that exact existing user ID:

   ```sql
   insert into private.platform_admins(user_id)
   values ('REPLACE_WITH_EXISTING_OPERATOR_USER_UUID');
   ```

   Revocation uses `update private.platform_admins set active=false where user_id=...` and takes effect for existing sessions. No application endpoint can grant this role; shop roles and editable account metadata never confer platform privileges.

3. Configure transactional email and the central workspace Site URL in Supabase Auth. Keep public registration disabled. Add the exact central-host redirect pattern `https://YOUR_WORKSPACE_HOST/accept-invite/*` alongside the existing recovery callback. Keep the default invitation and magic-link templates using `{{ .ConfirmationURL }}`. If customized, preserve its redirect; otherwise the owner may land on the wrong page.
4. Deploy `platform-invite` with `PLATFORM_APP_ORIGIN` set to the stable workspace origin. The deployment workflow sets this automatically from the environment's existing `APP_ORIGIN`. The function uses Supabase's built-in server credentials inside the Edge runtime. No service-role key or management token is added to the Next.js/Vercel runtime.
5. Verify the flow with a synthetic recipient first, including mail delivery, acceptance, password setup and tenant isolation. Hosted staging protection still applies to invitation links: reviewers must also have hosting access.

## Security and failure handling

Privileged SQL implementations remain in `private`, use fixed empty search paths and recheck current operator access. Public functions are caller-privilege wrappers. Operator grants cannot be changed through the data API. Invitation records have RLS; ordinary users cannot list invitations. Creation, membership changes, account changes and invitation transitions are audited without copying email addresses or tokens into the audit log.

The Edge Function verifies the caller's Auth token using `getUser`, checks platform administration, and atomically claims the saved invitation before reading its email. It accepts an invitation ID, not an arbitrary recipient or redirect URL. Modern signing keys are supported by disabling the legacy gateway JWT check and performing verification inside the handler. Unauthenticated and non-admin callers are rejected before any privileged operation.

Invitations expire seven days after creation and can be cancelled. Auth email links have their own shorter expiry; resend a valid invitation when needed, or create a new one after the invitation expires. Delivery attempts are separated by two minutes. Errors remain visible, and interrupted attempts can be retried; a message may have been sent before a delivery status write failed. Cancellation or expiry is checked at acceptance even if an email arrives later.

Email verification and membership acceptance are separate. Acceptance reads the authenticated user's confirmed email from Auth, locks the shop/invitation, and grants ownership only when it matches the invited address. Used invitations cannot be replayed to restore revoked access. Auth session fragments are removed from the browser address and exchanged for HTTP-only cookies on explicit acceptance; they are not stored in invitation rows or logs.

## Validation

`npm test` includes database authorization and lifecycle tests. `npm run db:test` checks SQL security conventions. With the local invitation function running, `npx playwright test tests/e2e/platform.spec.ts` checks the client-management UI, access denial, desktop/mobile accessibility, email delivery, duplicate-send throttling and complete acceptance/password setup for both new and existing accounts. Browser and integration tests remain local-only. CI starts the invitation function before browser tests.

The email flow follows Supabase's [invitation API](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail), [implicit session flow](https://supabase.com/docs/guides/auth/sessions/implicit-flow), and [server-side caller verification](https://supabase.com/docs/reference/javascript/auth-getuser).
