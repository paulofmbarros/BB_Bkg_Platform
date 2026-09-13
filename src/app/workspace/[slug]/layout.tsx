import Link from "next/link";
import { ArrowUpRight, LifeBuoy, ShieldCheck } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { requireTenant } from "@/modules/tenancy/context";
export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { tenant, user, role, supportMode } = await requireTenant(slug);
  return (
    <div className="workspace">
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
              <strong>Platform support mode</strong>
              <span>
                You are troubleshooting {tenant.name}. Customer details are
                hidden and appointment changes are disabled.
              </span>
            </div>
            <Link href={`/admin/clients/${tenant.id}`}>Back to client</Link>
          </div>
        )}
        <header className="topbar">
          <div className="breadcrumb">
            Your business <span>/</span> <strong>{tenant.name}</strong>
          </div>
          <div className="topbar-right">
            {tenant.is_demo && (
              <span className="demo-badge">SYNTHETIC DEMO</span>
            )}
            <Link
              className="preview-link"
              href={`/preview/${slug}`}
              target="_blank"
            >
              View customer page <ArrowUpRight size={16} />
            </Link>
          </div>
        </header>
        <main id="main-content" className="main-content">
          {children}
        </main>
        <footer className="workspace-footer">
          <span>Built around your business.</span>
          <span>
            <ShieldCheck size={14} />
            Private workspace · {tenant.currency} · Europe/Lisbon
          </span>
        </footer>
      </div>
    </div>
  );
}
