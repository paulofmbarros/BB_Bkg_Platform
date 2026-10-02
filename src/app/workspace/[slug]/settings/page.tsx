import { WorkspaceLink as Link } from "@/components/workspace-link";
import Image from "next/image";
import { ArrowUpRight, Globe, LockKeyhole } from "lucide-react";
import { getSettingsBusiness } from "@/modules/businesses/queries";
import {
  BrandingForm,
  LanguageSettingsForm,
  LogoForm,
} from "@/components/forms";
import { initials, contrastText } from "@/lib/format";
import { localeOrEnglish, translator } from "@/i18n/locales";
export default async function Settings({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const b = await getSettingsBusiness(slug);
  const locale = b.supportMode
    ? "en"
    : localeOrEnglish(b.tenant.workspace_locale);
  const t = translator(locale);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t("UNMISTAKABLY YOURS")}</span>
          <h1>
            {t("Make yourself known")}
            <span className="accent-period">.</span>
          </h1>
          <p>
            {t("The details that turn a booking page into your barbershop.")}
          </p>
        </div>
        <Link
          className="button secondary"
          href={`/preview/${slug}`}
          target="_blank"
        >
          {t("Preview customer page")} <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="settings-grid">
        <div>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>{t("Business details")}</h2>
                <p>{t("How customers see and find your shop.")}</p>
              </div>
            </div>
            {b.role === "owner" ? (
              <BrandingForm
                slug={slug}
                values={{
                  name: b.tenant.name,
                  ...b.branding,
                  address: b.location.address,
                  phone: b.location.phone,
                }}
              />
            ) : (
              <p className="quiet-empty">
                {t("Only the business owner can change these details.")}
              </p>
            )}
          </section>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>{t("Language")}</h2>
                <p>
                  {t(
                    "Choose the language used in the private workspace and on the public customer experience.",
                  )}
                </p>
              </div>
            </div>
            {b.role === "owner" && !b.supportMode ? (
              <LanguageSettingsForm
                slug={slug}
                workspaceLocale={localeOrEnglish(b.tenant.workspace_locale)}
                publicLocale={localeOrEnglish(b.tenant.public_locale)}
              />
            ) : (
              <p className="quiet-empty">
                {t("Only the business owner can change language settings.")}
              </p>
            )}
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>{t("Your logo")}</h2>
            </div>
            {b.role === "owner" ? (
              <LogoForm slug={slug} />
            ) : (
              <p className="quiet-empty">
                {t("Logo uploads are managed by the owner.")}
              </p>
            )}
          </section>
        </div>
        <div>
          <div
            className="brand-preview"
            style={{
              background: b.branding.accent_color,
              color: contrastText(b.branding.accent_color),
            }}
          >
            <span className="eyebrow">{t("YOUR BRAND, AT A GLANCE")}</span>
            {b.branding.logo_path ? (
              <Image
                unoptimized
                width={92}
                height={92}
                alt={`${b.tenant.name} logo`}
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/brand-assets/${b.branding.logo_path}`}
              />
            ) : (
              <div className="brand-initials">{initials(b.tenant.name)}</div>
            )}
            <h2>{b.tenant.name}</h2>
            <p>{b.branding.tagline}</p>
          </div>
          <section className="panel domain-panel">
            <Globe size={23} />
            <h2>{t("Your booking address")}</h2>
            {b.domains.map((d) => (
              <div key={d.hostname}>
                <strong className="domain-name">{d.hostname}</strong>
                <span className="status-pill">
                  {t(d.verified_at ? "Verified" : "Awaiting verification")}
                </span>
              </div>
            ))}
            <p>
              {t(
                "Custom domains use the same tenant registry. Connecting a live domain is a later deployment step.",
              )}
            </p>
          </section>
          <div className="privacy-note">
            <LockKeyhole size={18} />
            <p>
              {t(
                "Your shop’s settings and team are isolated from other businesses.",
              )}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
