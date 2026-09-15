# Rebooking opportunities

Owners and managers can review customers who are approaching or past their established return cadence. The workspace overview shows the count and potential service value, linking to an explainable review screen. Staff and platform support cannot access customer opportunities.

## Operating rule

A customer becomes eligible when:

- at least three distinct Europe/Lisbon completed visit days establish two or more intervals;
- the median interval between those visit days is positive;
- the customer is within the lead window or overdue;
- there is no future confirmed appointment;
- there is no past or ongoing appointment awaiting an outcome; and
- there is no other active customer profile using the same email address.

The lead window is 20% of the typical interval, rounded to a whole day, with a minimum of two and maximum of seven days. Visit cadence uses local calendar days so daylight-saving changes do not alter the interval.

The displayed potential value is the quoted price of the most recent completed service. It is not a forecast and is never described as booked, collected or recovered revenue. No message is sent and no marketing consent is inferred. The booking action uses the existing manager-only profile rebooking transaction.

## Verification

Pure unit tests cover the timing and explanation language. Database assertions cover the deterministic lead-window rule and security-invoker boundary. Integration coverage verifies median cadence, eligibility exclusions, summary totals and tenant/role isolation. Browser coverage checks the overview entry point, explanations, value disclaimer, mobile layout and automated WCAG AA rules.
