# Architecture decisions · Foundation, booking and customers

## Deployment and modules

One Next.js 16 App Router application, one PostgreSQL/Supabase project per environment. No microservices or separate queue. Next's installed documentation under `node_modules/next/dist/docs` is the API reference for this pinned version.

The public root page resolves the verified hostname; the central host resolves authenticated workspace membership. This avoids the local-host normalization and extra proxy hop involved in rewriting tenant roots. The proxy overwrites `x-shop-host` on every request; incoming client values cannot select a tenant. Unknown hosts return no shop. Public tenant hosts allow the shop, booking and management pages plus the narrow booking API. They cannot reach owner paths or owner mutations.

## Authorization and isolation

Ordinary operations use the authenticated Supabase caller, never a privileged runtime key. Active membership is queried on each request and by RLS, so membership revocation applies to existing access tokens. `private.tenant_role` is the narrow elevated lookup used to avoid recursive membership policies; it validates `auth.uid()` and has a fixed search path. No authorization comes from editable user metadata.

Tenant-owned composite foreign keys prevent cross-tenant staff/service/location relationships. Immutable ownership triggers reject tenant moves even by users belonging to two tenants. RLS implements SELECT, INSERT, UPDATE and DELETE separately. Column grants keep sensitive provisioning fields out of the client API. Foundation writes require both a management role and the current feature entitlement.

The public catalogue uses an explicit projection through an invoker RPC and a private elevated function. Its anonymous access is deliberate: a verified business domain exposes only the name, public branding/contact information, active services, active staff introductions and regular hours. It exposes no membership, user identity, financial data, audit trail or internal settings. There is no tenant-list endpoint or discovery UI.

Brand logos are public assets. Upload and delete policies constrain paths to the owner's tenant; MIME types, file signatures and size are checked. No SVG or executable upload is supported. Other future storage buckets must be private by default.

## Data integrity

Money is integer EUR cents. A service defines its duration and post-service buffer. Weekly hours store local wall times. Phase 1 is deliberately restricted to one location per tenant, EUR and Europe/Lisbon. The next scheduling increment must convert these rules into UTC intervals with explicit DST handling.

`save_hours`, `save_staff` and `save_branding` are caller-privilege database transactions. Invalid rows or cross-tenant references roll back the complete operation. Hours changes lock the relevant staff/location record; Phase 2 uses a shared tenant advisory lock before row locks for scheduling transactions, plus an exclusion constraint.

Audit triggers record tenant, actor, operation, entity and timestamp without copying full personal-data payloads. Clients cannot insert, modify or delete audit events. Audit retention and business offboarding need a controlled privileged workflow before live data.

## Deliberate constraints

- Owner access can be provisioned through the platform administrator client/invitation flow; platform operator access itself still requires trusted administration. See `platform-administration.md` for the separate invitation delivery boundary. There is no public self-onboarding.
- Platform support mode uses a server-only privileged client after verifying the caller's active platform role. Customer routes and customer mutations remain unavailable in that mode, and the calendar omits customer identity.
- Staff can read foundation catalogue and scheduling configuration, but cannot edit it. Appointment/customer access must be narrowed in Phase 2.
- One recurring interval and optional break per day; exceptions are full-day closures or leave. No overnight shifts or arbitrary split shifts yet.
- Phase 2 implements availability and bookings as described below.
- Public content and private workspace reads are dynamic. No cross-request private-data cache.
- Authentication is entirely server-side, with host-only HTTP-only session cookies. Password recovery requires the same browser's PKCE verifier.
- Current owner detail edits are last-write-wins. Optimistic version checks can be added if concurrent configuration editing becomes a demonstrated requirement.
- Service categories and UI are optimized for barbershops. Core entities remain services, staff and locations.

## Booking transactions

`appointments` stores price, service name, service duration and buffer snapshots. All client table writes are denied. Narrow private elevated functions authorize either a current manager or a 256-bit random guest capability, then execute the shared transition function. The public-schema wrappers use caller privileges. Runtime code still needs no privileged key.

The database exclusion constraint covers `[starts_at, blocked_until)` for every non-cancelled appointment. The availability query intersects business/staff hours, breaks, full-day exceptions, active service assignments and occupied intervals. UTC slot generation handles the missing/repeated Lisbon DST hour; intervals crossing an offset change are conservatively excluded. Slots are spaced 15 minutes apart, with 30 minutes minimum notice and a 90-day horizon.

The internal availability helper accepts a clock for deterministic SQL tests. It has no guest/member execution grant. Public wrappers always use the database clock. Scheduling configuration changes and bookings share a tenant advisory lock; the small V0 deliberately serializes decisions within each business. Existing bookings survive later hours/closure changes, so the calendar calls out the need to review them.

A displayed quote is compared to current service values before booking; the server never uses client-supplied prices as authoritative. Creation retries use the same capability and request fingerprint. A changed request cannot reuse that key. Rescheduling/cancellation checks a version number and locks the appointment, so stale updates cannot overwrite a newer change. Rescheduling preserves the agreed price and duration; changed service durations require contacting the shop.

## Guest identity and permissions

Guest details create an unverified customer row, without marketing consent. Email equality never merges customer identities or grants access. Verified identity resolution and full CRM are Phase 3+ work. Staff may read only appointments assigned to their linked staff profile and the customers on those appointments; owners/managers can read their tenant's calendar.

Management tokens are stored only as SHA-256 hashes. Links carry the token in the URL fragment, which is not sent in the page request or referrer. The client submits it in a POST body to the same-origin API. There is no email lookup/recovery endpoint and no booking email is sent. This is a capability link, not email-verified identity. Owners can manage appointments through their authenticated calendar when a guest loses a link.

Booking entitlement is off unless explicitly provisioned; only synthetic seed tenants opt in. Durable database limits cap creation at 60 bookings per tenant/hour and 5 per normalized email/hour, including cancelled bookings. These bound local-demo abuse but are not sufficient for a public launch: add challenge verification and trusted-edge rate limits before enabling a real tenant.

## Customer profiles and history

The customer directory and profiles use `customer_summaries`, a security-invoker aggregate view over the existing RLS-protected customer and appointment tables. Staff aggregates cover only their own appointments; management aggregates cover their tenant. Summary totals are independent of paginated detail rows. Completed service value uses appointment price snapshots and is explicitly not a payment metric.

Contact edits go through a private authorization function and caller-privilege public wrapper, with a row lock and version check. Clients cannot set verification, marketing consent or tenant ownership. Changing an email clears its verification state. Matching-email notices expose only records the caller can already read; no automatic merging takes place. See `phase-3-customers.md` for identity-resolution limits and the follow-up increment.

## Reviewed identity linking

`customer_links` records deliberate manager decisions with original appointment IDs and confirmation provenance. Source profiles remain stored and are excluded from the security-invoker directory view while linked. Linking compares profile versions and appointment revision digests, moves history atomically, and preserves retained contact/consent fields. Undo restores original customer associations without reverting appointment outcomes. Incoming links must be undone before a retained profile can become a source, preventing link chains. Guest capability responses use a captured booking name and never reveal the retained profile's contact details. See `customer-linking.md`.

## Profile rebooking

A manager-only transaction adds a new appointment to the existing customer ID, using the same availability engine and exclusion constraint as guest booking. It validates a displayed quote, customer version and entitlements, and records a tenant-scoped idempotency request in a private table. No guest capability is issued and no duplicate contact is created. Manager availability is independent of public domain registration. See `profile-rebooking.md`.

## Customer segments

`customer_segments` is a security-invoker view over customer summaries and RLS-protected duplicate checks. It additionally requires an owner or manager role: staff histories are partial and cannot support shop-wide labels. A pure private classifier applies fixed, ordered rules using completed visits, Lisbon calendar-day recency, future bookings, unresolved outcomes and possible duplicate identities. The invoker counts function applies the same search across all authorized profiles before pagination. No labels are persisted; fresh reads reflect booking, outcome and linking changes. See `customer-segments.md`.

## Daily business brief

The workspace overview derives a request-time operating snapshot from RLS-protected appointments. Europe/Lisbon calendar-day filtering determines today's remaining visits and completed-service value; a separate scoped count identifies all confirmed visits whose start time has passed and still need an outcome. Staff therefore see only their assignments, while managers see the tenant. Support-mode schedule reads deliberately omit customer identity. Completed-service value uses quoted appointment snapshots and is never presented as payment or revenue. See `daily-business-brief.md`.
