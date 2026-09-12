"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { SlotPicker } from "./booking-form";
import {
  appointmentDate,
  receiptSchema,
  shopDate,
  slotLabel,
  type Receipt,
} from "@/modules/bookings/types";
import { money } from "@/lib/format";
function subscribeHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}
export function ManageBooking() {
  const token = useSyncExternalStore(
    subscribeHash,
    () => window.location.hash.slice(1),
    () => "",
  );
  if (!/^[a-f0-9]{64}$/.test(token))
    return (
      <p role="alert">
        Open the complete private link you saved after booking.
      </p>
    );
  return <BookingReceipt key={token} token={token} />;
}
function BookingReceipt({ token }: { token: string }) {
  const [receipt, setReceipt] = useState<Receipt | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [editing, setEditing] = useState(false),
    [day, setDay] = useState(shopDate()),
    [start, setStart] = useState(""),
    [copied, setCopied] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "view", token }),
      signal: controller.signal,
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        return receiptSchema.parse(d);
      })
      .then(setReceipt)
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [token]);
  async function change(action: "cancel" | "reschedule") {
    if (!receipt || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          token,
          version: receipt.version,
          ...(action === "reschedule" ? { start } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setReceipt(receiptSchema.parse(data));
      setEditing(false);
      setStart("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="manage-booking">
      {error && (
        <p className="notice failure" role="alert">
          {error}
        </p>
      )}
      {!receipt && !error && <p role="status">Finding your appointment…</p>}
      {receipt && (
        <>
          <span className={`status-badge status-${receipt.status}`}>
            {receipt.status.replace("_", " ")}
          </span>
          <h2>
            {receipt.status === "confirmed"
              ? "Your time is reserved."
              : receipt.status === "cancelled"
                ? "Your appointment is cancelled."
                : "Your visit."}
          </h2>
          <p>{receipt.customer_name}, here are your appointment details.</p>
          <div className="booking-summary">
            <h3>{receipt.service_name}</h3>
            <p>With {receipt.barber}</p>
            <strong>{appointmentDate(receipt.starts_at)}</strong>
            <p>
              {slotLabel(receipt.starts_at)} – {slotLabel(receipt.ends_at)}
            </p>
            <strong>{money(receipt.price_minor)} · Pay at the shop</strong>
          </div>
          <div className="private-link-note">
            <strong>Save your private booking link</strong>
            <p>
              This link lets anyone holding it manage this appointment. Keep it
              private. Email delivery is not enabled in this demo.
            </p>
            <button
              className="button secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                  setCopied(true);
                } catch {
                  setError(
                    "Copy the full address from your browser to save your link.",
                  );
                }
              }}
            >
              {copied ? "Link copied" : "Copy private link"}
            </button>
          </div>
          {receipt.status === "confirmed" &&
            new Date(receipt.starts_at) > new Date() && (
              <>
                <p className="field-help">
                  Free cancellation and rescheduling before the appointment
                  starts.
                </p>
                <div className="booking-actions">
                  <button
                    className="button secondary"
                    onClick={() => {
                      setEditing(!editing);
                      setStart("");
                    }}
                  >
                    Choose another time
                  </button>
                  <button
                    className="button secondary danger-text"
                    disabled={busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Cancel this appointment? Your time will be released.",
                        )
                      )
                        void change("cancel");
                    }}
                  >
                    {busy ? "Saving…" : "Cancel appointment"}
                  </button>
                </div>
                {editing && (
                  <section className="booking-step">
                    <h3>Choose a new time</h3>
                    <SlotPicker
                      service={receipt.service_id}
                      staff={receipt.staff_id}
                      day={day}
                      onDay={setDay}
                      selected={start}
                      onSelect={setStart}
                    />
                    <button
                      className="button shop-button"
                      disabled={!start || busy}
                      onClick={() => void change("reschedule")}
                    >
                      Confirm new time
                    </button>
                  </section>
                )}
              </>
            )}
        </>
      )}
      <Link className="text-link" href="/book">
        Book another visit
      </Link>
    </div>
  );
}
