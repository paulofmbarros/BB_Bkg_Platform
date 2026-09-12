import {
  segmentLabels,
  segmentReason,
  type SegmentFields,
} from "@/modules/customers/segments";
export function CustomerSegment({
  customer,
}: {
  customer: SegmentFields & {
    completed_visits: number;
    upcoming_visits: number;
    awaiting_outcome: number;
  };
}) {
  return (
    <section className="panel segment-explanation">
      <span className={`status-badge segment-${customer.segment}`}>
        {segmentLabels[customer.segment]}
      </span>
      <h2>Why this segment?</h2>
      <p>{segmentReason(customer)}</p>
      <p className="field-help">
        Based on this profile’s recorded visits. This is a shop rule, not a
        prediction or a reason to send marketing without consent.
      </p>
    </section>
  );
}
export function SegmentRules() {
  return (
    <details className="panel segment-rules">
      <summary>How customer segments work</summary>
      <ul>
        <li>
          <strong>Needs review:</strong> matching active email records,
          unresolved visit outcomes, or a future-dated completed visit. This
          takes priority over every other segment.
        </li>
        <li>
          <strong>Inactive:</strong> at least one completed visit, none in 120
          days, and no upcoming appointment.
        </li>
        <li>
          <strong>At risk:</strong> at least one completed visit, none in 60–119
          days, and no upcoming appointment.
        </li>
        <li>
          <strong>New:</strong> zero or one completed visit, unless an earlier
          rule applies.
        </li>
        <li>
          <strong>Returning:</strong> two completed visits, unless an earlier
          rule applies.
        </li>
        <li>
          <strong>Regular:</strong> three or more completed visits, unless an
          earlier rule applies.
        </li>
      </ul>
      <p>
        Fixed V1 rules, using calendar days in Portugal. Cancellations and
        no-shows do not count as visits. A future booking prevents an at-risk or
        inactive label. Unlinked histories may still be incomplete, even when
        email addresses differ.
      </p>
    </details>
  );
}
