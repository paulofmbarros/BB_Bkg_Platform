import { Clock3 } from "lucide-react";
import { getHoursBusiness } from "@/modules/businesses/queries";
import { HoursEditor, Exceptions } from "@/components/forms";
import { localeOrEnglish, translator } from "@/i18n/locales";
export default async function Hours({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const b = await getHoursBusiness(slug);
  const t = translator(
    b.supportMode ? "en" : localeOrEnglish(b.tenant.workspace_locale),
  );
  const canEdit = b.role === "owner" || b.role === "manager";
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t("ROOM FOR WORK. TIME FOR LIFE.")}</span>
          <h1>
            {t("Your regular rhythm")}
            <span className="accent-period">.</span>
          </h1>
          <p>
            {t(
              "Set the shop’s opening hours and make space for a proper break.",
            )}
          </p>
        </div>
        <span className="timezone-label">
          <Clock3 size={16} />
          Europe / Lisbon
        </span>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>{t("Opening hours")}</h2>
            <p>{t("Your customer page uses this weekly schedule.")}</p>
          </div>
          <span className="status-pill">{t("Weekly schedule")}</span>
        </div>
        <HoursEditor
          slug={slug}
          subject={b.location.id}
          initialHours={b.hours}
          readOnly={!canEdit}
        />
      </section>
      <Exceptions
        slug={slug}
        rows={b.exceptions.filter((e) => !e.staff_id)}
        readOnly={!canEdit}
      />
      <p className="section-note">
        {t(
          "Individual working hours and time off can be adjusted in each team member’s profile.",
        )}
      </p>
    </>
  );
}
