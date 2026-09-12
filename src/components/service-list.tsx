"use client";
import { useState } from "react";
import { Search, Plus, Scissors, Clock3, ArrowUpRight } from "lucide-react";
import { Modal } from "./ui";
import { ServiceForm } from "./forms";
import { money } from "@/lib/format";
import type { Database } from "@/lib/supabase/database.types";
type Service = Database["public"]["Tables"]["services"]["Row"];
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
  const filtered = services.filter(
    (s) =>
      (category === "All services" || s.category === category) &&
      `${s.name} ${s.description}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="list-toolbar">
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
      <div className="service-grid">
        {filtered.map((s) => (
          <article className="service-card" key={s.id}>
            <div className="service-card-top">
              <span className={`service-symbol ${s.category.toLowerCase()}`}>
                <Scissors size={23} strokeWidth={1.4} />
              </span>
              <span className={`status-pill ${s.active ? "" : "inactive"}`}>
                {s.active ? "On the menu" : "Hidden"}
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
              </div>
            )}
          </article>
        ))}
      </div>
      {!filtered.length && (
        <div className="panel empty-state">
          <Scissors />
          <h2>No services found</h2>
          <p>
            {search
              ? "Try another name or category."
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
