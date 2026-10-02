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
import { useLocale, useTranslations } from "@/i18n/provider";
function subscribeHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}
export function ManageBooking({ demo = false }: { demo?: boolean }) {
  const t = useTranslations();
  const token = useSyncExternalStore(
    subscribeHash,
    () => window.location.hash.slice(1),
    () => "",
  );
  if (!/^[a-f0-9]{64}$/.test(token))
    return (
      <p role="alert">
        {t("Open the complete private link you saved after booking.")}
      </p>
    );
  return <BookingReceipt key={token} token={token} demo={demo} />;
}
function BookingReceipt({ token, demo }: { token: string; demo: boolean }) {
  const t = useTranslations();
  const locale = useLocale();
  const [receipt, setReceipt] = useState<Receipt | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [editing, setEditing] = useState(false),
    [day, setDay] = useState(shopDate()),
    [start, setStart] = useState(""),
    [copied, setCopied] = useState(false),
    [paying, setPaying] = useState(false);
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
        if (!controller.signal.aborted) setError(t(e.message));
      });
    return () => controller.abort();
  }, [token, t]);
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
      setError(e instanceof Error ? t(e.message) : t("Please try again."));
    } finally {
      setBusy(false);
    }
  }
  async function payDeposit() {
    if (!receipt || paying) return;
    setPaying(true);
    setError("");
    try {
      const response = await fetch("/api/booking/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url)
        throw new Error(data.error ?? "The payment page could not be opened.");
      window.location.assign(data.url);
    } catch (error) {
      setError(
        error instanceof Error
          ? t(error.message)
          : t("The payment page could not be opened."),
      );
      setPaying(false);
    }
  }
  return (
    <div className="manage-booking">
      {error && (
        <p className="notice failure" role="alert">
          {error}
        </p>
      )}
      {!receipt && !error && (
        <p role="status">{t("Finding your appointment…")}</p>
      )}
      {receipt && (
        <>
          <span className={`status-badge status-${receipt.status}`}>
            {t(receipt.status.replace("_", " "))}
          </span>
          <h2>
            {receipt.status === "confirmed"
              ? t("Your time is reserved.")
              : receipt.status === "cancelled"
                ? t("Your appointment is cancelled.")
                : t("Your visit.")}
          </h2>
          <p>
            {receipt.customer_name}, {t("here are your appointment details.")}
          </p>
          <div className="booking-summary">
            <h3>{receipt.service_name}</h3>
            <p>
              {t("With")} {receipt.barber}
            </p>
            <strong>{appointmentDate(receipt.starts_at, locale)}</strong>
            <p>
              {slotLabel(receipt.starts_at, locale)} –{" "}
              {slotLabel(receipt.ends_at, locale)}
            </p>
            <strong>{money(receipt.price_minor, locale)}</strong>
          </div>
          {receipt.deposit_required_minor > 0 ? (
            <section
              className="deposit-summary"
              aria-label={t("Deposit status")}
            >
              <div>
                <span className="eyebrow">{t("BOOKING DEPOSIT")}</span>
                <h3>
                  {money(receipt.deposit_required_minor, locale)} ·{" "}
                  {t(receipt.deposit_status.replaceAll("_", " "))}
                </h3>
                <p>
                  {locale === "pt"
                    ? `Reembolsável até ${new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Lisbon" }).format(new Date(receipt.cancellation_deadline))}.`
                    : `Refundable until ${new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Lisbon" }).format(new Date(receipt.cancellation_deadline))}.`}
                </p>
              </div>
              {receipt.deposit_status === "pending" && (
                <button
                  className="button shop-button"
                  disabled={paying || demo}
                  onClick={() => void payDeposit()}
                >
                  {t(
                    demo
                      ? "Demo payment disabled"
                      : paying
                        ? "Opening payment…"
                        : "Pay deposit",
                  )}
                </button>
              )}
              {receipt.deposit_status === "refund_due" && (
                <p className="notice success">
                  {t("Your deposit refund is due.")}
                </p>
              )}
            </section>
          ) : (
            <p className="field-help">{t("No booking deposit is required.")}</p>
          )}
          <div className="private-link-note">
            <strong>{t("Save your private booking link")}</strong>
            <p>
              {t(
                "This link lets anyone holding it manage this appointment. Keep it private. Email delivery is not enabled in this demo.",
              )}
            </p>
            <button
              className="button secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                  setCopied(true);
                } catch {
                  setError(
                    t(
                      "Copy the full address from your browser to save your link.",
                    ),
                  );
                }
              }}
            >
              {t(copied ? "Link copied" : "Copy private link")}
            </button>
          </div>
          {receipt.status === "confirmed" &&
            new Date(receipt.starts_at) > new Date() && (
              <>
                <p className="field-help">
                  {receipt.deposit_required_minor > 0
                    ? t(
                        "Cancel before the refund deadline to keep the deposit refundable. Rescheduling moves the deadline with the appointment.",
                      )
                    : t(
                        "Free cancellation and rescheduling before the appointment starts.",
                      )}
                </p>
                <div className="booking-actions">
                  <button
                    className="button secondary"
                    onClick={() => {
                      setEditing(!editing);
                      setStart("");
                    }}
                  >
                    {t("Choose another time")}
                  </button>
                  <button
                    className="button secondary danger-text"
                    disabled={busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          t(
                            "Cancel this appointment? Your time will be released.",
                          ),
                        )
                      )
                        void change("cancel");
                    }}
                  >
                    {t(busy ? "Saving…" : "Cancel appointment")}
                  </button>
                </div>
                {editing && (
                  <section className="booking-step">
                    <h3>{t("Choose a new time")}</h3>
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
                      {t("Confirm new time")}
                    </button>
                  </section>
                )}
              </>
            )}
        </>
      )}
      <Link className="text-link" href="/book">
        {t("Book another visit")}
      </Link>
    </div>
  );
}
