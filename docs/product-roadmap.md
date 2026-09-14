# Noma product roadmap

Last reviewed: 14 September 2026  
Roadmap owner: Product  
Current product stage: Validation and pilot preparation

Noma's product thesis is:

> Can Noma measurably help appointment-based businesses recover otherwise lost revenue?

The roadmap is organized around proving that thesis. Timelines are targets rather than commitments, and each phase has an evidence gate. A phase is not validated merely because its software has been implemented.

## Status language

- **Implemented:** the capability exists and has proportionate automated or documented verification.
- **Pilot-ready:** the capability and its operational prerequisites are safe enough for a limited real-business pilot.
- **Validated:** real customer behavior has met the phase's evidence gate.
- **Partial:** useful parts exist, but the phase's deliverables or gate are incomplete.
- **Deferred:** intentionally outside the current focus.

## Current status

| Phase                       | Target                   | Delivery status                                                                                                                                                                                                    | Evidence status                                                               | Next gate                                                                      |
| --------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **0. Validation & Demo**    | Weeks 1–2                | The synthetic Porto Gentlemen experience covers booking, calendar, CRM, customer segments, profile rebooking and a daily operating brief. Revenue-recovery actions remain illustrative rather than implemented.    | Owner-demo and pilot-commitment results are not yet recorded.                 | 10 or more owner demos and at least 3 credible pilot commitments.              |
| **1. Core Platform**        | Weeks 3–6                | Substantially implemented: multi-tenancy, branding, authentication, services, staff, hours, availability, booking, calendar, CRM and platform administration. PWA behavior is not implemented.                     | Tested with synthetic data in protected staging; no real shop is live.        | One barbershop runs real appointments through Noma.                            |
| **2. Retention Engine**     | Weeks 7–9                | Partial: customer history, reviewed identity linking, profile rebooking, explainable lifecycle segments and deterministic rebooking opportunities are implemented. Customer health and outreach campaigns are not. | No recorded evidence yet that owners use Noma to contact or rebook customers. | Owners repeatedly take measurable retention or rebooking actions.              |
| **3. Revenue Protection**   | Weeks 10–12              | Not started. Appointment no-show outcomes exist, but payments, deposits, reminders, risk scoring and deposit policies do not.                                                                                      | Not started.                                                                  | Evidence that deposits, reminders or policies reduce economic loss.            |
| **4. Revenue Recovery**     | Months 4–5               | Not started.                                                                                                                                                                                                       | Not started.                                                                  | Measurable revenue recovered per shop per month.                               |
| **5. Revenue Intelligence** | Months 6–7               | Early foundation only: a daily operating brief reports appointments, unresolved outcomes and completed-service value. It deliberately does not claim collected or recovered revenue.                               | Not started.                                                                  | Owners regularly act on recommendations.                                       |
| **6. Noma Copilot**         | Months 8–10              | Deferred until deterministic analytics and action workflows are proven.                                                                                                                                            | Not started.                                                                  | Insight leads to action and measurable revenue.                                |
| **7. Intelligence Network** | Months 10–15+            | Deferred until there is sufficient scale, consent and privacy design.                                                                                                                                              | Not started.                                                                  | Recommendations demonstrably improve with responsibly aggregated network data. |
| **8. New Verticals**        | After product-market fit | Deferred. The core domain remains generic to avoid preventing later expansion.                                                                                                                                     | Not started.                                                                  | Repeatable acquisition outside barbershops.                                    |

## Immediate priorities

1. Run structured demos with target barbershop owners and record the date, business profile, pain points, objections, willingness to pilot, willingness to pay and requested next step.
2. Secure at least three credible pilot commitments before expanding the feature surface further.
3. Select the first pilot and complete the live-pilot prerequisites in [Private staging deployment](staging.md), including transactional email, stronger public abuse protection, monitoring, restore verification and reviewed privacy, retention and booking policies.
4. Observe which economic problem owners prioritize: retention, no-shows or cancelled and empty slots. Use that evidence to confirm or reorder Phases 2–4.
5. Define conservative attribution rules before displaying revenue as influenced, protected or recovered.

## Phase 0 — Validation & Demo

### Goal

Get a polished, credible experience in front of barbershop owners before committing to months of additional product development.

The fictional Porto Gentlemen demo should let an owner experience:

- a branded customer booking journey;
- the owner calendar and customer profiles;
- visit history, customer segments and rebooking;
- no-show and revenue-opportunity concepts;
- an operating brief that clearly separates service value from collected revenue.

Advanced revenue actions may be simulated during discovery, but must be clearly identified as concepts rather than working product.

### Gate

At least 10 owner demos and at least 3 businesses expressing credible willingness to pilot. Positive reactions such as “looks useful” do not satisfy the gate without a concrete next step.

## Phase 1 — Core Platform

### Goal

Allow one real barbershop to run appointments through Noma safely.

### Scope

- tenant isolation, branded business pages and authenticated workspaces;
- services, staff, business hours, staff availability and closures;
- server-derived slots, booking, rescheduling, cancellation and calendar management;
- customer profiles and visit history;
- operational onboarding and support administration;
- a production-suitable mobile web experience, with installable PWA behavior if pilot evidence shows it is valuable.

The core domain stays generic: business, location, staff member, customer, service, appointment, availability and payment. Noma is not a marketplace and should not expose competing businesses on a shop's customer journey.

### Gate

One actual barbershop processes real appointments through Noma. Passing automated tests or deploying synthetic staging data does not satisfy this gate.

## Phase 2 — Retention Engine

### Goal

Help owners identify and act on customers who are due or at risk of not returning.

### Scope

- explainable visit frequency and expected return timing;
- smart rebooking using service and staff history;
- lifecycle segments such as New, Regular, VIP, At Risk and Inactive;
- customer-health explanations rather than opaque scores;
- consent-aware, measurable outreach actions.

### Gate

Owners repeatedly use Noma to contact or rebook customers, with the resulting appointments attributable to those actions.

## Phase 3 — Revenue Protection

### Goal

Reduce the economic loss caused by no-shows and late cancellations.

### Scope

- Stripe payments and locally appropriate supported payment methods;
- deposits, cancellation rules, refunds and reminders;
- an explainable deterministic no-show risk policy;
- configurable deposit rules based on transparent customer history;
- conservative reporting of revenue protected.

Machine learning is not required for the first version. The business defines the policy and Noma applies it.

### Gate

Pilot evidence shows a meaningful reduction in no-show loss or a measurable amount of revenue protected.

## Phase 4 — Revenue Recovery

### Goal

Establish Noma's initial differentiator by filling capacity that would otherwise be lost.

### Scope

- waitlists and cancellation recovery;
- empty-slot detection;
- deterministic customer-to-slot matching using service, preferred staff member, normal visit interval, elapsed time, duration and customer preferences;
- consent-aware notifications and booking conversion;
- a dashboard with explicit definitions for revenue influenced, protected and recovered.

### Gate

Noma consistently recovers measurable revenue per shop per month, with attribution strong enough to support the claim.

## Phase 5 — Revenue Intelligence

### Goal

Find actionable revenue opportunities proactively once sufficient operational data exists.

### Scope

- capacity utilization and revenue per available hour;
- demand by day and hour, service mix and staff capacity;
- rebooking, retention and break-even indicators;
- revenue-at-risk and opportunity detection;
- a daily brief that connects an observation to a concrete action.

### Gate

Owners regularly act on recommendations and those actions have measurable outcomes.

## Phase 6 — Noma Copilot

### Goal

Turn trustworthy analytics into understandable recommendations and executable actions.

Deterministic systems calculate financial and operational truth. An LLM may explain structured results, answer questions and orchestrate approved actions; it must not invent or independently calculate financial claims.

### Gate

There is a repeatable path from insight to owner action to measurable revenue outcome.

## Phase 7 — Intelligence Network

### Goal

Improve recommendations through privacy-preserving aggregate patterns once Noma has meaningful scale.

Potential applications include comparable-shop benchmarks, no-show probability, expected next visit, churn, demand forecasting and capacity optimization. Tenant isolation, consent, minimum cohort sizes and re-identification risk must be addressed before release.

### Gate

Network-derived recommendations perform better than shop-only baselines without weakening privacy or tenant isolation.

## Phase 8 — New Verticals

### Goal

Expand the proven recovery engine to salons, beauty, wellness, tattoo and other appointment-based businesses.

The infrastructure remains horizontal while terminology, workflows and intelligence become vertical-specific.

### Gate

Noma demonstrates repeatable acquisition and customer outcomes outside barbershops.

## Product measures

The north-star customer outcome is:

> Revenue recovered or protected by Noma per business per month.

MRR measures whether Noma is building a viable company. Recovered or protected revenue measures whether customers succeed because of Noma. Every contributing metric needs an explicit attribution definition and should avoid double-counting.

Supporting measures include:

- demos completed and pilot commitments secured;
- first real booking and active pilot shops;
- rebookings attributable to Noma actions;
- no-show rate and revenue protected;
- cancelled or empty slots filled and revenue recovered;
- recommendation view-to-action and action-to-booking conversion;
- retained shops and owner engagement.

## Explicitly outside the first-year focus

- native iOS and Android applications;
- inventory, ERP, payroll and accounting suites;
- microservices or event infrastructure without a demonstrated need;
- sophisticated machine learning before sufficient quality data exists;
- generic AI features without a measurable customer outcome;
- simultaneous expansion into many industries.

## Delivery evidence

This roadmap is the product and validation source of truth. Detailed implementation boundaries and verification remain in the technical handoffs:

- [Architecture decisions](architecture.md)
- [Phase 1 foundation handoff](phase-1.md)
- [Booking and calendar handoff](phase-2.md)
- [Customer profiles and history](phase-3-customers.md)
- [Profile rebooking](profile-rebooking.md)
- [Customer segments](customer-segments.md)
- [Rebooking opportunities](rebooking-opportunities.md)
- [Daily business brief](daily-business-brief.md)
- [Platform administration](platform-administration.md)
- [Private staging and live-pilot boundary](staging.md)

When implementation or customer evidence changes a phase, update the current-status table and the review date in the same pull request. Do not rewrite old technical handoffs to make historical delivery appear different.
