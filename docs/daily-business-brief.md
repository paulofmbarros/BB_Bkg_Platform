# Daily business brief

The workspace overview now begins with a live operating brief for the current Europe/Lisbon calendar day. It shows confirmed visits still ahead today, confirmed past or ongoing visits that still need a completed or no-show outcome, and the quoted value of services marked completed today.

The completed-service figure is an operational total from appointment price snapshots. It is explicitly not collected revenue: the product does not record payments, refunds, tips or settlement state. Cancelled, no-show and unresolved visits never contribute to it.

The upcoming list shows the next four confirmed visits and links to the current day's calendar. Owners and managers see the whole tenant. Staff inherit appointment row-level security and see only visits assigned to their linked staff profile. Platform support can see operating counts and schedule details but customer identity remains hidden, matching the support calendar boundary.

Dates and ordering use Europe/Lisbon local time, including daylight-saving transitions. The brief is computed on every request and is not persisted, so appointment status and scheduling changes appear on the next load.

## Verification

Unit coverage fixes the classification, ordering, value semantics and repeated autumn DST hour. Browser coverage checks the visible revenue disclaimer and includes the overview in automated WCAG AA validation.
