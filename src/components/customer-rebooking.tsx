"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { SlotPicker } from "./booking-form";
import { rebookCustomer } from "@/modules/customers/rebooking";
import { shopDate, slotLabel } from "@/modules/bookings/types";
import { customerDate } from "@/modules/customers/format";
import { money } from "@/lib/format";
export type RebookingOptions = {
  services: {
    id: string;
    name: string;
    price_minor: number;
    duration_minutes: number;
  }[];
  staff: { id: string; display_name: string; service_ids: string[] }[];
  previousService?: string;
  previousStaff?: string;
};
export function CustomerRebooking({
  slug,
  customer,
  options,
}: {
  slug: string;
  customer: {
    id: string;
    version: number;
    display_name: string;
    email: string;
  };
  options: RebookingOptions;
}) {
  const [service, setService] = useState(
      options.services.some((s) => s.id === options.previousService)
        ? options.previousService!
        : (options.services[0]?.id ?? ""),
    ),
    [staff, setStaff] = useState(options.previousStaff ?? ""),
    [day, setDay] = useState(shopDate()),
    [start, setStart] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState(false),
    [refresh, setRefresh] = useState(0);
  const request = useRef<{ signature: string; id: string } | null>(null),
    barbers = options.staff.filter((s) => s.service_ids.includes(service)),
    selectedStaff = barbers.some((s) => s.id === staff)
      ? staff
      : (barbers[0]?.id ?? ""),
    selectedService = options.services.find((s) => s.id === service);
  if (done)
    return (
      <section className="panel">
        <h2>Next visit booked.</h2>
        <p>
          {customer.display_name} · {selectedService?.name}
        </p>
        <p>
          {customerDate(start)} at {slotLabel(start)}
        </p>
        <p>
          This appointment is saved in the existing customer’s history. No email
          or payment was sent.
        </p>
        <div className="booking-actions">
          <Link
            className="button primary"
            href={`/workspace/${slug}/calendar?day=${day}`}
          >
            View in calendar
          </Link>
          <Link
            className="button secondary"
            href={`/workspace/${slug}/customers/${customer.id}`}
          >
            Back to customer profile
          </Link>
        </div>
      </section>
    );
  if (!options.services.length)
    return (
      <section className="panel">
        <h2>No active services available.</h2>
        <p>Add or activate a service and assign a barber before booking.</p>
      </section>
    );
  return (
    <form
      className="booking-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy || !start || !selectedService) return;
        const values = {
          customer: customer.id,
          version: customer.version,
          service,
          staff: selectedStaff,
          start,
          price: selectedService.price_minor,
          duration: selectedService.duration_minutes,
        };
        const signature = JSON.stringify(values);
        if (request.current?.signature !== signature)
          request.current = { signature, id: crypto.randomUUID() };
        setBusy(true);
        setError("");
        try {
          const result = await rebookCustomer(slug, {
            ...values,
            request: request.current.id,
          });
          if (result.ok) setDone(true);
          else {
            setError(result.message);
            setRefresh((r) => r + 1);
          }
        } catch {
          setError(
            "Couldn’t confirm the booking. Try again with the same details.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <section className="booking-step">
        <span className="eyebrow">EXISTING CUSTOMER</span>
        <h2>{customer.display_name}</h2>
        <p>{customer.email}</p>
        <p className="field-help">
          This visit will be added directly to this profile.
        </p>
      </section>
      <section className="booking-step">
        <label className="field">
          Service
          <select
            value={service}
            onChange={(e) => {
              setService(e.target.value);
              setStart("");
            }}
          >
            {options.services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {money(s.price_minor)} · {s.duration_minutes} min
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Barber
          <select
            value={selectedStaff}
            onChange={(e) => {
              setStaff(e.target.value);
              setStart("");
            }}
          >
            {barbers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.display_name}
              </option>
            ))}
          </select>
        </label>
        <p className="field-help">
          The last completed visit is suggested where its service and barber are
          still available. Prices shown are current.
        </p>
        <SlotPicker
          api={`/api/workspace/${slug}/slots`}
          service={service}
          staff={selectedStaff}
          day={day}
          onDay={setDay}
          selected={start}
          onSelect={setStart}
          refresh={refresh}
        />
      </section>
      <div className="booking-summary">
        <strong>
          {selectedService?.name} · {money(selectedService?.price_minor ?? 0)}
        </strong>
        <p>
          {start
            ? `${customerDate(start)} at ${slotLabel(start)}`
            : "Choose an available time."}
        </p>
        <p>
          Pay at the shop. No email is sent. Manage changes from the calendar.
        </p>
      </div>
      {error && (
        <p role="alert" className="notice failure">
          {error}
        </p>
      )}
      <button className="button primary" disabled={busy || !start}>
        {busy ? "Booking next visit…" : "Book next visit"}
      </button>
    </form>
  );
}
