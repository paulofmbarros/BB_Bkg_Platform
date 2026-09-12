import { Plus } from "lucide-react";
import { getBusiness } from "@/modules/businesses/queries";
import { ServiceList } from "@/components/service-list";
import { ServiceForm } from "@/components/forms";
import { Modal } from "@/components/ui";
export default async function Services({
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
          <span className="eyebrow">THE CRAFT, CONSIDERED</span>
          <h1>
            Your service menu<span className="accent-period">.</span>
          </h1>
          <p>Good experiences start with clear expectations.</p>
        </div>
        {canEdit && (
          <Modal
            label="Add service"
            title="Add a service"
            className="button primary"
            icon={<Plus size={17} />}
          >
            <ServiceForm slug={slug} />
          </Modal>
        )}
      </div>
      <ServiceList slug={slug} services={b.services} canEdit={canEdit} />
    </>
  );
}
