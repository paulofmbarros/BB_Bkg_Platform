import {
  healthLabels,
  healthReason,
  type RetentionHealth,
} from "@/modules/customers/health";

export function CustomerHealth({ health }: { health: RetentionHealth }) {
  return (
    <section className="panel retention-health">
      <span className={`status-badge health-${health.health_status}`}>
        {healthLabels[health.health_status]}
      </span>
      <h2>Retention health</h2>
      <p>{healthReason(health)}</p>
      <p className="field-help">
        This explanation uses recorded visits and fixed rules. It is not a
        predictive score, and it does not grant permission to contact the
        customer.
      </p>
    </section>
  );
}
