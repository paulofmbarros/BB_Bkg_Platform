"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createSessionClient } from "@/lib/supabase/server";

export type AuthResult = { message: string; ok?: boolean };
export async function signIn(
  _previous: AuthResult,
  form: FormData,
): Promise<AuthResult> {
  const input = z
    .object({ email: z.email(), password: z.string().min(1).max(200) })
    .safeParse(Object.fromEntries(form));
  if (!input.success) return { message: "Enter a valid email and password." };
  const db = await createSessionClient();
  const { error } = await db.auth.signInWithPassword(input.data);
  if (error)
    return {
      message: "Unable to sign in. Check your details or try again later.",
    };
  redirect("/");
}
export async function demoSignIn() {
  const host = (await headers()).get("host")?.split(":")[0];
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.LOCAL_DEMO !== "true" ||
    !["127.0.0.1", "localhost"].includes(host ?? "")
  )
    redirect("/login");
  const db = await createSessionClient();
  const { error } = await db.auth.signInWithPassword({
    email: "owner@porto-gentlemen.example",
    password: "PortoDemo!2026",
  });
  if (error) redirect("/login?demo=unavailable");
  redirect("/workspace/porto-gentlemen");
}
export async function signOut() {
  const db = await createSessionClient();
  await db.auth.signOut();
  redirect("/login");
}
export async function requestReset(
  _previous: AuthResult,
  form: FormData,
): Promise<AuthResult> {
  const email = z.email().safeParse(form.get("email"));
  if (!email.success) return { message: "Enter a valid email address." };
  const db = await createSessionClient();
  const { error } = await db.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${process.env.APP_ORIGIN}/auth/callback`,
  });
  if (error)
    console.error(
      JSON.stringify({ event: "password_recovery_failed", code: error.code }),
    );
  return {
    ok: true,
    message:
      "If that address has an account, a recovery link will arrive shortly.",
  };
}
export async function updatePassword(
  _previous: AuthResult,
  form: FormData,
): Promise<AuthResult> {
  const parsed = z
    .object({
      password: z.string().min(12, "Use at least 12 characters.").max(200),
      confirm: z.string(),
    })
    .refine((v) => v.password === v.confirm, "Passwords must match.")
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { message: parsed.error.issues[0].message };
  const db = await createSessionClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user)
    return { message: "Your recovery link has expired. Request another link." };
  const { error } = await db.auth.updateUser({
    password: parsed.data.password,
  });
  if (error)
    return {
      message: "Could not update your password. Request a new recovery link.",
    };
  await db.auth.signOut({ scope: "global" });
  redirect("/login?reset=success");
}
