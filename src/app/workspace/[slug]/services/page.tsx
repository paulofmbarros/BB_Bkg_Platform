import { Plus } from "lucide-react";
import { getServiceBusiness } from "@/modules/businesses/queries";
import { ServiceList } from "@/components/service-list";
import { ServiceForm } from "@/components/forms";
import { Modal } from "@/components/ui";
import { localeOrEnglish, translator } from "@/i18n/locales";
export default async function Services({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const b = await getServiceBusiness(slug);
  const t = translator(
    b.supportMode ? "en" : localeOrEnglish(b.tenant.workspace_locale),
  );
  const canEdit = b.role === "owner" || b.role === "manager";
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t("THE CRAFT, CONSIDERED")}</span>
          <h1>
            {t("Your service menu")}
            <span className="accent-period">.</span>
          </h1>
          <p>{t("Good experiences start with clear expectations.")}</p>
        </div>
        {canEdit && (
          <Modal
            label={t("Add service")}
            title={t("Add a service")}
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
