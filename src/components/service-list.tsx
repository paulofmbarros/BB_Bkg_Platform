"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArrowUpRight,
  Clock3,
  Plus,
  RotateCcw,
  Scissors,
  Search,
} from "lucide-react";
import { Modal } from "./ui";
import { ServiceForm } from "./forms";
import { money } from "@/lib/format";
import {
  setServiceArchived,
  type ActionResult,
} from "@/modules/businesses/actions";
import type { Database } from "@/lib/supabase/database.types";
type Service = Database["public"]["Tables"]["services"]["Row"];
type ServiceStatus = "current" | "archived" | "all";
export function ServiceList({
  slug,
  services,
  canEdit,
}: {
  slug: string;
  services: Service[];
  canEdit: boolean;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All services");
  const [status, setStatus] = useState<ServiceStatus>("current");
  const [notice, setNotice] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const filtered = services.filter(
    (s) =>
      (status === "all" || (status === "current" ? s.active : !s.active)) &&
      (category === "All services" || s.category === category) &&
      `${s.name} ${s.description}`.toLowerCase().includes(search.toLowerCase()),
  );
  const statuses: { value: ServiceStatus; label: string; count: number }[] = [
    {
      value: "current",
      label: "Current",
      count: services.filter((service) => service.active).length,
    },
    {
      value: "archived",
      label: "Archived",
      count: services.filter((service) => !service.active).length,
    },
    { value: "all", label: "All", count: services.length },
  ];
  return (
    <>
      <div className="list-toolbar">
        <div className="service-filters">
          <div className="filter-tabs" aria-label="Service status">
            {statuses.map((option) => (
              <button
                key={option.value}
                aria-pressed={status === option.value}
                className={status === option.value ? "selected" : ""}
                onClick={() => setStatus(option.value)}
              >
                {option.label} · {option.count}
              </button>
            ))}
          </div>
          <div className="filter-tabs" aria-label="Service category">
            {["All services", "Hair", "Beard", "Rituals"].map((c) => (
              <button
                key={c}
                aria-pressed={category === c}
                className={category === c ? "selected" : ""}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <label className="search-field">
          <Search size={17} />
          <input
            aria-label="Search services"
            placeholder="Find a service…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      {notice && (
        <p
          role={notice.ok ? "status" : "alert"}
          className={`notice service-notice ${notice.ok ? "success" : "failure"}`}
        >
          {notice.message}
        </p>
      )}
      <div className="service-grid">
        {filtered.map((s) => (
          <article className="service-card" key={s.id}>
            <div className="service-card-top">
              <span className={`service-symbol ${s.category.toLowerCase()}`}>
                <Scissors size={23} strokeWidth={1.4} />
              </span>
              <span className={`status-pill ${s.active ? "" : "inactive"}`}>
                {s.active ? "On the menu" : "Archived"}
              </span>
            </div>
            <span className="eyebrow">{s.category.toUpperCase()}</span>
            <h2>{s.name}</h2>
            <p>{s.description || "No description added yet."}</p>
            <div className="service-details">
              <span>
                <Clock3 size={15} />
                {s.duration_minutes} min{" "}
                <small>+ {s.buffer_minutes} min buffer</small>
              </span>
              <strong>{money(s.price_minor)}</strong>
            </div>
            {canEdit && (
              <div className="service-action">
                <Modal
                  label="Edit service"
                  title={`Edit ${s.name}`}
                  className="text-link"
                  icon={<ArrowUpRight size={15} />}
                >
                  <ServiceForm slug={slug} service={s} />
                </Modal>
                <button
                  type="button"
                  className="text-link service-archive-action"
                  disabled={pending}
                  onClick={() => {
                    if (
                      s.active &&
                      !window.confirm(
                        `Archive ${s.name}? It will disappear from new bookings, but existing appointments and reporting will be preserved.`,
                      )
                    )
                      return;
                    setNotice(null);
                    startTransition(async () => {
                      const result = await setServiceArchived(
                        slug,
                        s.id,
                        s.active,
                      );
                      setNotice(result);
                      if (result.ok) router.refresh();
                    });
                  }}
                >
                  {s.active ? <Archive size={15} /> : <RotateCcw size={15} />}
                  {pending
                    ? "Updating…"
                    : s.active
                      ? "Archive service"
                      : "Restore service"}
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
      {!filtered.length && (
        <div className="panel empty-state">
          <Scissors />
          <h2>
            {status === "archived" && category === "All services" && !search
              ? "No archived services"
              : "No services found"}
          </h2>
          <p>
            {search || category !== "All services"
              ? "Try another name or category."
              : status === "archived"
                ? "Services you archive will appear here with their history preserved."
                : "Add the first service to your menu."}
          </p>
        </div>
      )}
      {canEdit && (
        <div className="inline-add">
          <Modal
            label="Add another service"
            title="Add a service"
            icon={<Plus size={16} />}
          >
            <ServiceForm slug={slug} />
          </Modal>
          <span>Prices and durations are always set by your business.</span>
        </div>
      )}
    </>
  );
}
