import Link from "next/link";
import { Plus, ArrowUpRight, Clock3, Scissors } from "lucide-react";
import { getBusiness } from "@/modules/businesses/queries";
import { StaffForm } from "@/components/forms";
import { Modal } from "@/components/ui";
import { initials } from "@/lib/format";
import { weeklyHours } from "@/modules/scheduling/hours";
export default async function Team({
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
          <span className="eyebrow">THE PEOPLE MAKE THE PLACE</span>
          <h1>
            Behind every good cut<span className="accent-period">.</span>
          </h1>
          <p>Your team, their craft, and the time they make available.</p>
        </div>
        {canEdit && (
          <Modal
            label="Add team member"
            title="Add a team member"
            className="button primary"
            icon={<Plus size={17} />}
          >
            <StaffForm slug={slug} services={b.services} />
          </Modal>
        )}
      </div>
      <div className="team-grid">
        {b.staff.map((s, i) => (
          <article key={s.id} className="team-card">
            <div className={`team-card-banner tone-${i % 4}`}>
              <span className={`avatar large avatar-${i % 4}`}>
                {initials(s.display_name)}
              </span>
              <span className={`status-pill ${s.active ? "" : "inactive"}`}>
                {s.active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="team-card-content">
              <h2>{s.display_name}</h2>
              <span className="staff-title">{s.title}</span>
              <p>
                {s.bio ||
                  "Add a short introduction to help customers get to know this barber."}
              </p>
              <div className="staff-facts">
                <span>
                  <Scissors size={15} />
                  {b.assignments.filter((a) => a.staff_id === s.id).length}{" "}
                  services
                </span>
                <span>
                  <Clock3 size={15} />
                  {weeklyHours(
                    b.staffHours.filter((h) => h.staff_id === s.id),
                  )}{" "}
                  hrs / week
                </span>
              </div>
              <Link
                href={`/workspace/${slug}/team/${s.id}`}
                className="team-detail-link"
              >
                Profile & working hours <ArrowUpRight size={17} />
              </Link>
            </div>
          </article>
        ))}
      </div>
      <p className="section-note">
        Team profiles describe availability and services. Workspace access is
        managed separately.
      </p>
    </>
  );
}
