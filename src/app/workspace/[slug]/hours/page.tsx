import { Clock3 } from "lucide-react";
import { getBusiness } from "@/modules/businesses/queries";
import { HoursEditor, Exceptions } from "@/components/forms";
export default async function Hours({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const b = await getBusiness(slug);
  const canEdit = b.role === "owner" || b.role === "manager";
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ROOM FOR WORK. TIME FOR LIFE.</span>
          <h1>
            Your regular rhythm<span className="accent-period">.</span>
          </h1>
          <p>Set the shop’s opening hours and make space for a proper break.</p>
        </div>
        <span className="timezone-label">
          <Clock3 size={16} />
          Europe / Lisbon
        </span>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Opening hours</h2>
            <p>Your customer page uses this weekly schedule.</p>
          </div>
          <span className="status-pill">Weekly schedule</span>
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
        Individual working hours and time off can be adjusted in each team
        member’s profile.
      </p>
    </>
  );
}
