# Reviewed customer linking

Owners and managers can link a confirmed duplicate guest record to an existing customer profile. This is a deliberate internal identity decision, not an automatic email match or email verification.

## Walkthrough

1. Open the customer record whose history should move.
2. Choose **Link to an existing profile**.
3. Search by name/email and select the profile to keep. Matching emails are suggested only.
4. Review both records, appointment counts and completed service values.
5. Choose how identity was confirmed, acknowledge that both records belong to the same person, and submit.
6. Open the retained profile. The linked record is hidden from the directory and its appointments now contribute to the retained history.
7. Use **Undo link** on the retained profile to separate the original histories again.

No customer links are applied automatically. Existing demo profiles are preserved.

## Integrity and privacy

The transaction checks current management permission, active tenant, foundation entitlement, same-tenant records, profile versions and a digest of appointment IDs/versions. A scheduling advisory lock and ordered customer row locks serialize linking against booking changes. Concurrent or stale reviews cannot both succeed.

Contact details, verification and marketing preferences on the retained profile stay unchanged. The source record is preserved rather than deleted. Appointment prices, schedules and statuses are not rewritten; customer association and version are updated. Link records retain source/target IDs, the moved appointment IDs, confirmation method, actor and timestamps. Audit triggers record linking and undo.

Guest capabilities retain the name captured when the booking was created (existing capabilities were backfilled with their pre-link name). Their response remains scoped to one appointment, without retained-profile contact details or other visits. Staff permissions continue to limit histories and totals to their own appointments.

Undo returns exactly the original moved appointments, preserving later cancellations, reschedules and other appointment changes. It rejects an already-undone link or unexpectedly reassigned/deleted records. Profiles receiving active links cannot themselves be linked elsewhere until those incoming links are undone; this deliberately avoids ambiguous chains.

## Remaining limits

Identity confirmation is a manager's attestation, not an automated identity-verification service. Public repeat bookings still start as separate guest records for later review. Linking does not subscribe anyone to marketing. Owners/managers can now book a repeat visit directly from the retained profile; see `profile-rebooking.md`.

A linked source's old URL redirects to the retained profile only when the caller can still read the source record. Staff whose source record is no longer visible receive the normal unavailable page. The owner can find preserved source details in the retained profile's link history.

## Verification · 12 September 2026

34 unit/integration tests, 19 database assertions and 16 browser tests pass. Coverage includes concurrent linking, stale reviews, tenant/role boundaries, unchanged consent, guest capability isolation, undo preserving subsequent appointment changes, and the complete mobile review flow. Production build, TypeScript, lint and formatting checks pass. The security advisor reports no warnings or errors. The review screenshot was visually inspected and passed automated accessibility checks. No existing customer profiles were linked automatically.
