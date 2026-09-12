"use client";
import { useActionState } from "react";
import Link from "next/link";
import {
  signIn,
  requestReset,
  updatePassword,
} from "@/modules/identity/actions";
import { SubmitButton } from "./ui";
export function AuthForm({
  mode = "login",
}: {
  mode?: "login" | "recovery" | "reset";
}) {
  const fn =
    mode === "login"
      ? signIn
      : mode === "recovery"
        ? requestReset
        : updatePassword;
  const [state, action] = useActionState(fn, { message: "" });
  return (
    <form action={action} className="edit-form">
      {mode !== "reset" && (
        <label>
          Email address
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@yourbarbershop.com"
            required
          />
        </label>
      )}
      {mode !== "recovery" && (
        <label>
          {mode === "reset" ? "New password" : "Password"}
          <input
            name="password"
            type="password"
            autoComplete={
              mode === "reset" ? "new-password" : "current-password"
            }
            minLength={mode === "reset" ? 12 : 1}
            maxLength={200}
            required
          />
        </label>
      )}
      {mode === "reset" && (
        <label>
          Confirm password
          <input
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
          />
        </label>
      )}
      {mode === "login" && (
        <Link className="forgot-link" href="/forgot-password">
          Forgot password?
        </Link>
      )}
      {state.message && (
        <p
          role={state.ok ? "status" : "alert"}
          className={`notice ${state.ok ? "success" : "failure"}`}
        >
          {state.message}
        </p>
      )}
      <SubmitButton>
        {mode === "login"
          ? "Sign in to your workspace"
          : mode === "recovery"
            ? "Send recovery link"
            : "Set new password"}
      </SubmitButton>
    </form>
  );
}
