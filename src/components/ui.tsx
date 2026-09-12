"use client";
import { useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Check, LoaderCircle, X } from "lucide-react";
import type { ActionResult } from "@/modules/businesses/actions";

export function SubmitButton({
  children = "Save changes",
  className = "button primary",
}: {
  children?: ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button className={className} type="submit" disabled={pending}>
      {pending ? <LoaderCircle size={16} className="spin" /> : null}
      {pending ? "Saving…" : children}
    </button>
  );
}
export function FormNotice({ state }: { state: ActionResult }) {
  if (!state.message) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={`notice ${state.ok ? "success" : "failure"}`}
    >
      {state.ok && <Check size={16} />} {state.message}
    </p>
  );
}
export function Modal({
  label,
  title,
  children,
  className = "button secondary",
  icon,
}: {
  label: string;
  title: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button className={className} onClick={() => ref.current?.showModal()}>
        {icon}
        {label}
      </button>
      <dialog
        ref={ref}
        className="modal"
        aria-label={title}
        onClick={(event) => {
          if (event.target === event.currentTarget) ref.current?.close();
        }}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button
            type="button"
            className="icon-button"
            aria-label="Close dialog"
            onClick={() => ref.current?.close()}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </dialog>
    </>
  );
}
