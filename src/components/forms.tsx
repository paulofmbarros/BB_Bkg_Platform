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
  saveLanguageSettings,
  type ActionResult,
} from "@/modules/businesses/actions";
import { languageNames, weekdayNames, type Locale } from "@/i18n/locales";
import { useLocale, useTranslations } from "@/i18n/provider";
import { FormNotice, SubmitButton, Modal } from "./ui";
import { trimHours, weeklyHours, type Hours } from "@/modules/scheduling/hours";
import type { Database } from "@/lib/supabase/database.types";
type Service = Database["public"]["Tables"]["services"]["Row"];
type Staff = Database["public"]["Tables"]["staff_members"]["Row"];
type Exception = Database["public"]["Tables"]["availability_exceptions"]["Row"];
const initial: ActionResult = { ok: false, message: "" };

export function LanguageSettingsForm({
  slug,
  workspaceLocale,
  publicLocale,
}: {
  slug: string;
  workspaceLocale: Locale;
  publicLocale: Locale;
}) {
  const t = useTranslations();
  const [state, action] = useActionState(
    saveLanguageSettings.bind(null, slug),
    initial,
  );
  return (
    <form action={action} className="edit-form">
      <div className="form-grid">
        <label>
          {t("Owner workspace language")}
          <select name="workspace_locale" defaultValue={workspaceLocale}>
            {Object.entries(languageNames).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("Public shop and booking language")}
          <select name="public_locale" defaultValue={publicLocale}>
            {Object.entries(languageNames).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <FormNotice state={state} />
      <div className="form-footer">
        <SubmitButton>{t("Save language settings")}</SubmitButton>
      </div>
    </form>
  );
}

export function ServiceForm({
  slug,
  service,
}: {
  slug: string;
  service?: Service;
}) {
  const t = useTranslations();
  const [state, action] = useActionState(
    saveService.bind(null, slug, service?.id ?? null),
    initial,
  );
  return (
    <form action={action} className="edit-form">
      <label>
        {t("Service name")}
        <input
          name="name"
          required
          minLength={2}
          maxLength={80}
          defaultValue={service?.name}
          placeholder={t("e.g. Signature cut")}
        />
      </label>
      <label>
        {t("Description")}
        <textarea
          name="description"
          maxLength={240}
          defaultValue={service?.description}
          placeholder={t("What’s included in the experience?")}
          rows={3}
        />
      </label>
      <div className="form-grid">
        <label>
          {t("Category")}
          <select name="category" defaultValue={service?.category ?? "Hair"}>
            <option value="Hair">{t("Hair")}</option>
            <option value="Beard">{t("Beard")}</option>
            <option value="Rituals">{t("Rituals")}</option>
          </select>
        </label>
        <label>
          {t("Price (€)")}
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
          {t("Duration (minutes)")}
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
          {t("Buffer after (minutes)")}
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
        {t("Active and available for new bookings")}
      </label>
      {service && (
        <p className="field-help">
          {t(
            "Turn this off to archive the service. Existing appointments and reporting history will be preserved.",
          )}
        </p>
      )}
      <FormNotice state={state} />
      <div className="form-footer">
        <SubmitButton>
          {t(service ? "Save service" : "Add service")}
        </SubmitButton>
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
  const t = useTranslations();
  const [state, action] = useActionState(
    saveStaff.bind(null, slug, staff?.id ?? null),
    initial,
  );
  return (
    <form action={action} className="edit-form">
      <label>
        {t("Full name")}
        <input
          name="display_name"
          required
          minLength={2}
          maxLength={80}
          defaultValue={staff?.display_name}
        />
      </label>
      <label>
        {t("Role / title")}
        <input
          name="title"
          required
          minLength={2}
          maxLength={100}
          defaultValue={staff?.title ?? "Barber"}
        />
      </label>
      <label>
        {t("About this barber")}
        <textarea
          name="bio"
          rows={3}
          maxLength={240}
          defaultValue={staff?.bio}
        />
      </label>
      <fieldset>
        <legend>{t("Services they offer")}</legend>
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
              {!s.active ? ` ${t("(hidden)")}` : ""}
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
        {t("Active team member")}
      </label>
      <p className="field-help">
        {t("A team profile does not grant access to the owner workspace.")}
      </p>
      <FormNotice state={state} />
      <div className="form-footer">
        <SubmitButton>
          {t(staff ? "Save team member" : "Add team member")}
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
  const t = useTranslations();
  const locale = useLocale();
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
          <span>{t("DAY")}</span>
          <span>{t("WORKING HOURS")}</span>
          <span>{t("BREAK")}</span>
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
              <span>{weekdayNames[locale][row.weekday]}</span>
            </label>
            {row.enabled ? (
              <>
                <div className="time-range">
                  <input
                    aria-label={`${weekdayNames[locale][row.weekday]} ${t("opening time")}`}
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
                    aria-label={`${weekdayNames[locale][row.weekday]} ${t("closing time")}`}
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
                    aria-label={`${weekdayNames[locale][row.weekday]} ${t("break start")}`}
                    type="time"
                    disabled={readOnly}
                    value={row.break_start ?? ""}
                    onChange={(e) =>
                      update(row.weekday, "break_start", e.target.value || null)
                    }
                  />
                  <span>–</span>
                  <input
                    aria-label={`${weekdayNames[locale][row.weekday]} ${t("break end")}`}
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
              <span className="closed-label">{t("Closed")}</span>
            )}
          </div>
        ))}
      </div>
      <div className="hours-footer">
        <span>
          <strong>
            {weeklyHours(rows).toLocaleString(
              locale === "pt" ? "pt-PT" : "en-GB",
              {
                maximumFractionDigits: 1,
              },
            )}{" "}
            {t("hours")}
          </strong>{" "}
          {t("per week")} · Europe/Lisbon
        </span>
        {!readOnly && (
          <button className="button primary" disabled={pending}>
            {pending ? t("Saving…") : t("Save working hours")}
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
  const t = useTranslations();
  const [state, action] = useActionState(
    addException.bind(null, slug, staffId),
    initial,
  );
  return (
    <form action={action} className="edit-form">
      <label>
        {t("Reason")}
        <input
          name="reason"
          required
          minLength={2}
          maxLength={120}
          placeholder={t(
            staffId ? "e.g. Annual leave" : "e.g. Christmas holiday",
          )}
        />
      </label>
      <div className="form-grid">
        <label>
          {t("First day")}
          <input name="start_date" type="date" required />
        </label>
        <label>
          {t("Last day (inclusive)")}
          <input name="end_date" type="date" required />
        </label>
      </div>
      <p className="field-help">
        {t("All-day exception, in the shop’s local timezone.")}
      </p>
      <FormNotice state={state} />
      <div className="form-footer">
        <SubmitButton>
          {t(staffId ? "Add time off" : "Add closure")}
        </SubmitButton>
      </div>
    </form>
  );
}
function RemoveException({ slug, id }: { slug: string; id: string }) {
  const t = useTranslations();
  const [state, setState] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <>
      <button
        className="icon-button"
        aria-label={t("Remove exception")}
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
  const t = useTranslations();
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>{t(staffId ? "Time off" : "Special closures")}</h2>
          <p>{t("Exceptions to your regular week.")}</p>
        </div>
        {!readOnly && (
          <Modal
            label={t(staffId ? "Add time off" : "Add closure")}
            title={t(staffId ? "Add time off" : "Add a closure")}
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
          {t(
            staffId
              ? "No time off scheduled."
              : "No special closures scheduled.",
          )}
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
  const t = useTranslations();
  const [state, action] = useActionState(
    saveBranding.bind(null, slug),
    initial,
  );
  return (
    <form className="edit-form" action={action}>
      <div className="form-grid">
        <label>
          {t("Business name")}
          <input
            name="name"
            required
            minLength={2}
            maxLength={80}
            defaultValue={values.name}
          />
        </label>
        <label>
          {t("Tagline")}
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
        {t("About your shop")}
        <textarea
          name="description"
          rows={3}
          maxLength={500}
          defaultValue={values.description}
        />
      </label>
      <div className="form-grid">
        <label>
          {t("Address")}
          <input
            name="address"
            required
            minLength={5}
            maxLength={200}
            defaultValue={values.address}
          />
        </label>
        <label>
          {t("Contact number")}
          <input
            name="phone"
            type="tel"
            maxLength={30}
            defaultValue={values.phone}
          />
        </label>
      </div>
      <label>
        {t("Brand colour")}
        <div className="colour-input">
          <input
            type="color"
            name="accent_color"
            defaultValue={values.accent_color}
          />
          <span>
            {t(
              "Sets the colour system across your customer page and booking flow.",
            )}
          </span>
        </div>
      </label>
      <FormNotice state={state} />
      <div className="form-footer">
        <SubmitButton>
          {t("Save business details")} <ArrowRight size={16} />
        </SubmitButton>
      </div>
    </form>
  );
}
export function LogoForm({ slug }: { slug: string }) {
  const t = useTranslations();
  const [state, action] = useActionState(uploadLogo.bind(null, slug), initial);
  return (
    <form action={action} className="edit-form">
      <label>
        {t("Shop logo")}
        <input
          type="file"
          name="logo"
          accept="image/png,image/jpeg,image/webp"
          required
        />
      </label>
      <p className="field-help">
        {t("PNG, JPEG or WebP. Up to 2 MB. Your logo is publicly visible.")}
      </p>
      <FormNotice state={state} />
      <SubmitButton className="button secondary">
        <Upload size={16} />
        {t("Upload logo")}
      </SubmitButton>
    </form>
  );
}
