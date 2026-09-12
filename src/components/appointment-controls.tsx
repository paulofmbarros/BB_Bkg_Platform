"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { changeAppointment } from "@/modules/bookings/actions";
import { shopDate } from "@/modules/bookings/types";
import { SlotPicker } from "./booking-form";
export function AppointmentControls({
  slug,
  id,
  version,
  service,
  staff,
  startsAt,
  endsAt,
}: {
  slug: string;
  id: string;
  version: number;
  service: string;
  staff: string;
  startsAt: string;
  endsAt: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [ok, setOk] = useState(false),
    [editing, setEditing] = useState(false),
    [day, setDay] = useState(shopDate()),
    [start, setStart] = useState("");
  async function change(action: string) {
    setBusy(true);
    setNotice("");
    try {
      const result = await changeAppointment(slug, {
        id,
        version,
        action,
        ...(action === "reschedule" ? { start } : {}),
      });
      setOk(result.ok);
      setNotice(result.message);
      if (result.ok) {
        setEditing(false);
        router.refresh();
      }
    } catch {
      setOk(false);
      setNotice("Couldn’t save the change. Reload and try again.");
    } finally {
      setBusy(false);
    }
  }
  const future = new Date(startsAt) > new Date();
  return (
    <div className="appointment-controls">
      {notice && (
        <p
          role={ok ? "status" : "alert"}
          className={`notice ${ok ? "success" : "failure"}`}
        >
          {notice}
        </p>
      )}
      <div className="booking-actions">
        {future ? (
          <>
            <button
              className="button secondary"
              onClick={() => setEditing(!editing)}
            >
              Reschedule
            </button>
            <button
              disabled={busy}
              className="button secondary danger-text"
              onClick={() => {
                if (
                  window.confirm(
                    "Cancel this appointment and release the time?",
                  )
                )
                  void change("cancel");
              }}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              disabled={busy || new Date(endsAt) > new Date()}
              className="button secondary"
              onClick={() => void change("complete")}
            >
              Mark completed
            </button>
            <button
              disabled={busy}
              className="button secondary"
              onClick={() => {
                if (window.confirm("Mark this customer as a no-show?"))
                  void change("no_show");
              }}
            >
              Mark no-show
            </button>
          </>
        )}
      </div>
      {editing && (
        <div className="booking-step">
          <SlotPicker
            api={`/api/workspace/${slug}/slots`}
            service={service}
            staff={staff}
            day={day}
            onDay={setDay}
            selected={start}
            onSelect={setStart}
          />
          <button
            className="button primary"
            disabled={!start || busy}
            onClick={() => void change("reschedule")}
          >
            Save new time
          </button>
        </div>
      )}
    </div>
  );
}
