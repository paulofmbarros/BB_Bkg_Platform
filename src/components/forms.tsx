"use client";
import { useActionState, useState, useTransition } from "react";
import { Plus, Trash2, Upload, Check, ArrowRight } from "lucide-react";
import {
  saveService,
  saveStaff,
  saveBranding,
  saveHours,
  addException,
  removeException,
  uploadLogo,
  type ActionResult,
} from "@/modules/businesses/actions";
import { FormNotice, SubmitButton, Modal } from "./ui";
import {
  trimHours,
  weekdays,
  weeklyHours,
  type Hours,
} from "@/modules/scheduling/hours";
import type { Database } from "@/lib/supabase/database.types";
type Service = Database["public"]["Tables"]["services"]["Row"];
type Staff = Database["public"]["Tables"]["staff_members"]["Row"];
type Exception = Database["public"]["Tables"]["availability_exceptions"]["Row"];
const initial: ActionResult = { ok: false, message: "" };

export function ServiceForm({
  slug,
  service,
}: {
  slug: string;
  service?: Service;
}) {
  const [state, action] = useActionState(
    saveService.bind(null, slug, service?.id ?? null),
    initial,
  );
  return (
    <form action={action} className="edit-form">
      <label>
        Service name
        <input
          name="name"
          required
          minLength={2}
          maxLength={80}
          defaultValue={service?.name}
          placeholder="e.g. Signature cut"
        />
      </label>
      <label>
        Description
        <textarea
          name="description"
          maxLength={240}
          defaultValue={service?.description}
          placeholder="What’s included in the experience?"
          rows={3}
        />
      </label>
      <div className="form-grid">
        <label>
          Category
          <select name="category" defaultValue={service?.category ?? "Hair"}>
            <option>Hair</option>
            <option>Beard</option>
            <option>Rituals</option>
          </select>
        </label>
        <label>
          Price (€)
          <input
            name="price"
            inputMode="decimal"
            required
            pattern="[0-9]+(\.[0-9]{1,2})?"
            defaultValue={service ? (service.price_minor / 100).toFixed(2) : ""}
            placeholder="28.00"
          />
        </label>
        <label>
          Duration (minutes)
          <input
            name="duration_minutes"
            type="number"
            min={5}
            max={480}
            required
            defaultValue={service?.duration_minutes ?? 45}
          />
        </label>
        <label>
          Buffer after (minutes)
          <input
            name="buffer_minutes"
            type="number"
            min={0}
            max={120}
            required
            defaultValue={service?.buffer_minutes ?? 5}
          />
        </label>
      </div>
      <label className="check-label">
        <input
          type="checkbox"
          name="active"
          defaultChecked={service?.active ?? true}
        />
        Available on your customer page
      </label>
      <FormNotice state={state} />
      <div className="form-footer">
        <SubmitButton>{service ? "Save service" : "Add service"}</SubmitButton>
      </div>
    </form>
  );
}
export function StaffForm({
  slug,
  staff,
  services,
  assigned = [],
}: {
  slug: string;
  staff?: Staff;
  services: Service[];
  assigned?: string[];
}) {
  const [state, action] = useActionState(
    saveStaff.bind(null, slug, staff?.id ?? null),
    initial,
  );
  return (
    <form action={action} className="edit-form">
      <label>
        Full name
        <input
          name="display_name"
          required
          minLength={2}
          maxLength={80}
          defaultValue={staff?.display_name}
        />
      </label>
      <label>
        Role / title
        <input
          name="title"
          required
          minLength={2}
          maxLength={100}
          defaultValue={staff?.title ?? "Barber"}
        />
      </label>
      <label>
        About this barber
        <textarea
          name="bio"
          rows={3}
          maxLength={240}
          defaultValue={staff?.bio}
        />
      </label>
      <fieldset>
        <legend>Services they offer</legend>
        <div className="checkbox-grid">
          {services.map((s) => (
            <label className="check-label" key={s.id}>
              <input
                type="checkbox"
                name="service_ids"
                value={s.id}
                defaultChecked={assigned.includes(s.id)}
              />
              {s.name}
              {!s.active ? " (hidden)" : ""}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="check-label">
        <input
          type="checkbox"
          name="active"
          defaultChecked={staff?.active ?? true}
        />
        Active team member
      </label>
      <p className="field-help">
        A team profile does not grant access to the owner workspace.
      </p>
      <FormNotice state={state} />
      <div className="form-footer">
        <SubmitButton>
          {staff ? "Save team member" : "Add team member"}
        </SubmitButton>
      </div>
    </form>
  );
}

export function HoursEditor({
  slug,
  subject,
  staff = false,
  initialHours,
  readOnly = false,
}: {
  slug: string;
  subject: string;
  staff?: boolean;
  initialHours: Hours[];
  readOnly?: boolean;
}) {
  const [rows, setRows] = useState(() => trimHours(initialHours));
  const [state, setState] = useState(initial);
  const [pending, startTransition] = useTransition();
  function update(
    day: number,
    key: keyof Hours,
    value: string | boolean | null,
  ) {
    setRows(rows.map((r) => (r.weekday === day ? { ...r, [key]: value } : r)));
    setState(initial);
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () =>
          setState(await saveHours(slug, subject, staff, rows)),
        );
      }}
    >
      <div className="hours-table">
        <div className="hours-labels">
          <span>DAY</span>
          <span>WORKING HOURS</span>
          <span>BREAK</span>
        </div>
        {rows.map((row) => (
          <div
            className={`hours-row ${!row.enabled ? "closed" : ""}`}
            key={row.weekday}
          >
            <label className="day-toggle">
              <input
                type="checkbox"
                role="switch"
                disabled={readOnly}
                checked={row.enabled}
                onChange={(e) =>
                  update(row.weekday, "enabled", e.target.checked)
                }
              />
              <span>{weekdays[row.weekday]}</span>
            </label>
            {row.enabled ? (
              <>
                <div className="time-range">
                  <input
                    aria-label={`${weekdays[row.weekday]} opening time`}
                    type="time"
                    required
                    disabled={readOnly}
                    value={row.start_time}
                    onChange={(e) =>
                      update(row.weekday, "start_time", e.target.value)
                    }
                  />
                  <span>–</span>
                  <input
                    aria-label={`${weekdays[row.weekday]} closing time`}
                    type="time"
                    required
                    disabled={readOnly}
                    value={row.end_time}
                    onChange={(e) =>
                      update(row.weekday, "end_time", e.target.value)
                    }
                  />
                </div>
                <div className="time-range">
                  <input
                    aria-label={`${weekdays[row.weekday]} break start`}
                    type="time"
                    disabled={readOnly}
                    value={row.break_start ?? ""}
                    onChange={(e) =>
                      update(row.weekday, "break_start", e.target.value || null)
                    }
                  />
                  <span>–</span>
                  <input
                    aria-label={`${weekdays[row.weekday]} break end`}
                    type="time"
                    disabled={readOnly}
                    value={row.break_end ?? ""}
                    onChange={(e) =>
                      update(row.weekday, "break_end", e.target.value || null)
                    }
                  />
                </div>
              </>
            ) : (
              <span className="closed-label">Closed</span>
            )}
          </div>
        ))}
      </div>
      <div className="hours-footer">
        <span>
          <strong>
            {weeklyHours(rows).toLocaleString("en-GB", {
              maximumFractionDigits: 1,
            })}{" "}
            hours
          </strong>{" "}
          per week · Europe/Lisbon
        </span>
        {!readOnly && (
          <button className="button primary" disabled={pending}>
            {pending ? "Saving…" : "Save working hours"}
            <Check size={16} />
          </button>
        )}
      </div>
      <FormNotice state={state} />
    </form>
  );
}

function ExceptionForm({
  slug,
  staffId,
}: {
  slug: string;
  staffId: string | null;
}) {
  const [state, action] = useActionState(
    addException.bind(null, slug, staffId),
    initial,
  );
  return (
    <form action={action} className="edit-form">
      <label>
        Reason
        <input
          name="reason"
          required
          minLength={2}
          maxLength={120}
          placeholder={staffId ? "e.g. Annual leave" : "e.g. Christmas holiday"}
        />
      </label>
      <div className="form-grid">
        <label>
          First day
          <input name="start_date" type="date" required />
        </label>
        <label>
          Last day (inclusive)
          <input name="end_date" type="date" required />
        </label>
      </div>
      <p className="field-help">
        All-day exception, in the shop’s local timezone.
      </p>
      <FormNotice state={state} />
      <div className="form-footer">
        <SubmitButton>Add {staffId ? "time off" : "closure"}</SubmitButton>
      </div>
    </form>
  );
}
function RemoveException({ slug, id }: { slug: string; id: string }) {
  const [state, setState] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <>
      <button
        className="icon-button"
        aria-label="Remove exception"
        disabled={pending}
        onClick={() =>
          start(async () => setState(await removeException(slug, id)))
        }
      >
        <Trash2 size={16} />
      </button>
      {state.message && !state.ok && <FormNotice state={state} />}
    </>
  );
}
export function Exceptions({
  slug,
  staffId = null,
  rows,
  readOnly = false,
}: {
  slug: string;
  staffId?: string | null;
  rows: Exception[];
  readOnly?: boolean;
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>{staffId ? "Time off" : "Special closures"}</h2>
          <p>Exceptions to your regular week.</p>
        </div>
        {!readOnly && (
          <Modal
            label={staffId ? "Add time off" : "Add closure"}
            title={staffId ? "Add time off" : "Add a closure"}
            icon={<Plus size={16} />}
          >
            <ExceptionForm slug={slug} staffId={staffId} />
          </Modal>
        )}
      </div>
      {rows.length ? (
        rows.map((row) => (
          <div className="exception-row" key={row.id}>
            <div>
              <strong>{row.reason}</strong>
              <p>
                {row.start_date} → {row.end_date}
              </p>
            </div>
            {!readOnly && <RemoveException slug={slug} id={row.id} />}
          </div>
        ))
      ) : (
        <div className="quiet-empty">
          No {staffId ? "time off" : "special closures"} scheduled.
        </div>
      )}
    </section>
  );
}

export function BrandingForm({
  slug,
  values,
}: {
  slug: string;
  values: {
    name: string;
    tagline: string;
    description: string;
    accent_color: string;
    address: string;
    phone: string;
  };
}) {
  const [state, action] = useActionState(
    saveBranding.bind(null, slug),
    initial,
  );
  return (
    <form className="edit-form" action={action}>
      <div className="form-grid">
        <label>
          Business name
          <input
            name="name"
            required
            minLength={2}
            maxLength={80}
            defaultValue={values.name}
          />
        </label>
        <label>
          Tagline
          <input
            name="tagline"
            required
            minLength={2}
            maxLength={120}
            defaultValue={values.tagline}
          />
        </label>
      </div>
      <label>
        About your shop
        <textarea
          name="description"
          rows={3}
          maxLength={500}
          defaultValue={values.description}
        />
      </label>
      <div className="form-grid">
        <label>
          Address
          <input
            name="address"
            required
            minLength={5}
            maxLength={200}
            defaultValue={values.address}
          />
        </label>
        <label>
          Contact number
          <input
            name="phone"
            type="tel"
            maxLength={30}
            defaultValue={values.phone}
          />
        </label>
      </div>
      <label>
        Brand colour
        <div className="colour-input">
          <input
            type="color"
            name="accent_color"
            defaultValue={values.accent_color}
          />
          <span>Your customer page’s primary colour.</span>
        </div>
      </label>
      <FormNotice state={state} />
      <div className="form-footer">
        <SubmitButton>
          Save business details <ArrowRight size={16} />
        </SubmitButton>
      </div>
    </form>
  );
}
export function LogoForm({ slug }: { slug: string }) {
  const [state, action] = useActionState(uploadLogo.bind(null, slug), initial);
  return (
    <form action={action} className="edit-form">
      <label>
        Shop logo
        <input
          type="file"
          name="logo"
          accept="image/png,image/jpeg,image/webp"
          required
        />
      </label>
      <p className="field-help">
        PNG, JPEG or WebP. Up to 2 MB. Your logo is publicly visible.
      </p>
      <FormNotice state={state} />
      <SubmitButton className="button secondary">
        <Upload size={16} />
        Upload logo
      </SubmitButton>
    </form>
  );
}
