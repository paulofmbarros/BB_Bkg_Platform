"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PublicShop } from "@/modules/businesses/public-shop";
import {
  addDays,
  shopDate,
  slotLabel,
  slotSchema,
  type Slot,
} from "@/modules/bookings/types";
import { money } from "@/lib/format";

export function SlotPicker({
  service,
  staff,
  day,
  onDay,
  selected,
  onSelect,
  refresh = 0,
  api = "/api/booking",
}: {
  service: string;
  staff: string;
  day: string;
  onDay: (day: string) => void;
  selected: string;
  onSelect: (slot: string) => void;
  refresh?: number;
  api?: string;
}) {
  const requestKey = JSON.stringify([service, staff, day, refresh, api]);
  const [result, setResult] = useState<{
    key: string;
    slots: Slot[];
    error: string;
  } | null>(null);
  const loading = !!service && !!staff && !!day && result?.key !== requestKey;
  const slots = result?.key === requestKey ? result.slots : [];
  const error = result?.key === requestKey ? result.error : "";
  useEffect(() => {
    if (!service || !staff || !day) return;
    const controller = new AbortController();
    fetch(`${api}?${new URLSearchParams({ service, staff, day })}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return slotSchema.array().parse(data);
      })
      .then((slots) => {
        if (!controller.signal.aborted)
          setResult({ key: requestKey, slots, error: "" });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setResult({
            key: requestKey,
            slots: [],
            error:
              error instanceof Error ? error.message : "Unable to load times.",
          });
      });
    return () => controller.abort();
  }, [service, staff, day, refresh, api, requestKey]);
  return (
    <div className="slot-picker">
      <label className="field">
        Date
        <input
          type="date"
          required
          value={day}
          min={shopDate()}
          max={addDays(shopDate(), 90)}
          onChange={(e) => {
            onDay(e.target.value);
            onSelect("");
          }}
        />
      </label>
      <p className="field-help">
        Times in Portugal · Book 30 minutes to 90 days ahead.
      </p>
      {loading ? (
        <p role="status">Finding available times…</p>
      ) : error ? (
        <p role="alert" className="notice failure">
          {error}
        </p>
      ) : !service || !staff ? (
        <p>Choose your service and barber first.</p>
      ) : slots.length === 0 ? (
        <p role="status" className="empty-times">
          No times available. Try another day or barber.
        </p>
      ) : (
        <fieldset className="slot-fieldset">
          <legend>Available times</legend>
          <div className="slot-grid">
            {slots.map((slot) => (
              <button
                key={slot.starts_at}
                type="button"
                className={`time-slot ${selected === slot.starts_at ? "selected" : ""}`}
                aria-pressed={selected === slot.starts_at}
                onClick={() => onSelect(slot.starts_at)}
              >
                {slotLabel(slot.starts_at)}
              </button>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}
export function BookingForm({
  shop,
  initialService = "",
}: {
  shop: PublicShop;
  initialService?: string;
}) {
  const router = useRouter();
  const [service, setService] = useState(
    shop.services.some((s) => s.id === initialService)
      ? initialService
      : (shop.services[0]?.id ?? ""),
  );
  const barbers = shop.staff.filter((s) => s.service_ids.includes(service));
  const [staff, setStaff] = useState("");
  const selectedStaff = barbers.some((s) => s.id === staff)
    ? staff
    : (barbers[0]?.id ?? "");
  const [day, setDay] = useState(shopDate()),
    [start, setStart] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [refresh, setRefresh] = useState(0);
  const attempt = useRef<{ signature: string; token: string } | null>(null);
  const selectedService = shop.services.find((s) => s.id === service);
  return (
    <form
      className="booking-form"
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy || !start) return;
        const form = new FormData(event.currentTarget);
        const details = {
          action: "create",
          quote: {
            price_minor: selectedService?.price_minor,
            duration_minutes: selectedService?.duration_minutes,
          },
          service,
          staff: selectedStaff,
          start,
          name: String(form.get("name")),
          email: String(form.get("email")),
        };
        const signature = JSON.stringify(details);
        if (attempt.current?.signature !== signature)
          attempt.current = {
            signature,
            token: Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
              b.toString(16).padStart(2, "0"),
            ).join(""),
          };
        const token = attempt.current.token;
        setBusy(true);
        setError("");
        try {
          const response = await fetch("/api/booking", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...details, token }),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error);
          router.push(`/manage#${token}`);
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "Couldn’t book. Please try again.",
          );
          setRefresh((n) => n + 1);
          setBusy(false);
        }
      }}
    >
      <div className="booking-step">
        <span className="eyebrow">01 · YOUR VISIT</span>
        <label className="field">
          Service
          <select
            value={service}
            onChange={(e) => {
              setService(e.target.value);
              setStart("");
            }}
          >
            {shop.services.map((s) => (
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
      </div>
      <div className="booking-step">
        <span className="eyebrow">02 · MAKE TIME FOR YOURSELF</span>
        <SlotPicker
          service={service}
          staff={selectedStaff}
          day={day}
          onDay={setDay}
          selected={start}
          onSelect={setStart}
          refresh={refresh}
        />
      </div>
      <div className="booking-step">
        <span className="eyebrow">03 · A FEW DETAILS</span>
        <label className="field">
          Your name
          <input
            name="name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={80}
          />
        </label>
        <label className="field">
          Email address
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
          />
        </label>
        <p className="field-help">
          We use these details for your appointment. You are not signing up for
          marketing.
        </p>
      </div>
      <div className="booking-summary">
        <strong>
          {selectedService?.name} · {money(selectedService?.price_minor ?? 0)}
        </strong>
        <p>
          {start
            ? `${day} at ${slotLabel(start)}`
            : "Choose an available time to continue."}
        </p>
        <p>
          Pay at the shop. Cancel or reschedule free before your appointment
          starts using your private link.
        </p>
        {shop.is_demo && (
          <p>
            Fictional shop: use made-up contact details. No email or payment is
            sent.
          </p>
        )}
      </div>
      {error && (
        <p role="alert" className="notice failure">
          {error}
        </p>
      )}
      <button className="button shop-button" disabled={busy || !start}>
        {busy ? "Booking your visit…" : "Confirm appointment"}
      </button>
      <Link href="/" className="text-link">
        Back to the shop
      </Link>
    </form>
  );
}
