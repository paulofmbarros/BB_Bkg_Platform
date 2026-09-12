import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { getBusiness } from "@/modules/businesses/queries";
import { StaffForm, HoursEditor, Exceptions } from "@/components/forms";
import { Modal } from "@/components/ui";
export default async function StaffProfile({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const b = await getBusiness(slug);
  const s = b.staff.find((s) => s.id === id);
  if (!s) notFound();
  const canEdit = b.role === "owner" || b.role === "manager";
  return (
    <>
      <Link className="back-link" href={`/workspace/${slug}/team`}>
        <ArrowLeft size={16} />
        Back to the team
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{s.title.toUpperCase()}</span>
          <h1>{s.display_name}</h1>
          <p>{s.bio}</p>
        </div>
        {canEdit && (
          <Modal
            label="Edit profile"
            title={`Edit ${s.display_name}`}
            icon={<Pencil size={16} />}
          >
            <StaffForm
              slug={slug}
              staff={s}
              services={b.services}
              assigned={b.assignments
                .filter((a) => a.staff_id === id)
                .map((a) => a.service_id)}
            />
          </Modal>
        )}
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Working hours</h2>
            <p>
              Availability is limited by both these hours and the shop’s opening
              hours.
            </p>
          </div>
        </div>
        <HoursEditor
          slug={slug}
          subject={id}
          staff
          initialHours={b.staffHours.filter((h) => h.staff_id === id)}
          readOnly={!canEdit}
        />
      </section>
      <Exceptions
        slug={slug}
        staffId={id}
        rows={b.exceptions.filter((e) => e.staff_id === id)}
        readOnly={!canEdit}
      />
    </>
  );
}
