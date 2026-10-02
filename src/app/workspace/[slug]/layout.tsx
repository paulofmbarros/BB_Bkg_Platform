import Link from "next/link";
import { ArrowUpRight, LifeBuoy, ShieldCheck } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { requireTenant } from "@/modules/tenancy/context";
import { LocaleProvider } from "@/i18n/provider";
import { localeOrEnglish, translator } from "@/i18n/locales";
export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { tenant, user, role, supportMode } = await requireTenant(slug);
  // Platform administrators always work in English, including support mode.
  const locale = supportMode ? "en" : localeOrEnglish(tenant.workspace_locale);
  const t = translator(locale);
  return (
    <LocaleProvider locale={locale}>
      <div className="workspace" lang={locale === "pt" ? "pt-PT" : "en"}>
        <Navigation
          slug={slug}
          name={tenant.name}
          role={role}
          email={user.email ?? ""}
          supportMode={supportMode}
        />
        <div className="workspace-content">
          {supportMode && (
            <div className="support-mode-banner" role="status">
              <LifeBuoy size={18} />
              <div>
                <strong>{t("Platform support mode")}</strong>
                <span>
                  {locale === "pt"
                    ? `Está a prestar suporte a ${tenant.name}. ${t("Customer details are hidden and appointment changes are disabled.")}`
                    : `You are troubleshooting ${tenant.name}. ${t("Customer details are hidden and appointment changes are disabled.")}`}
                </span>
              </div>
              <Link href={`/admin/clients/${tenant.id}`} prefetch={false}>
                {t("Back to client")}
              </Link>
            </div>
          )}
          <header className="topbar">
            <div className="breadcrumb">
              {t("Your business")} <span>/</span> <strong>{tenant.name}</strong>
            </div>
            <div className="topbar-right">
              {tenant.is_demo && (
                <span className="demo-badge">SYNTHETIC DEMO</span>
              )}
              <Link
                className="preview-link"
                href={`/preview/${slug}`}
                target="_blank"
                prefetch={false}
              >
                {t("View customer page")} <ArrowUpRight size={16} />
              </Link>
            </div>
          </header>
          <main id="main-content" className="main-content">
            {children}
          </main>
          <footer className="workspace-footer">
            <span>{t("Built around your business.")}</span>
            <span>
              <ShieldCheck size={14} />
              {t("Private workspace")} · {tenant.currency} · Europe/Lisbon
            </span>
          </footer>
        </div>
      </div>
    </LocaleProvider>
  );
}
