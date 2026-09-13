import { AuthForm } from "@/components/auth-form";
export default async function ResetPassword({
  searchParams,
}: {
  searchParams: Promise<{ invited?: string }>;
}) {
  const { invited } = await searchParams;
  return (
    <main className="standalone auth-card">
      <span className="eyebrow">
        {invited === "1" ? "FINISH YOUR ACCOUNT SETUP" : "ACCOUNT RECOVERY"}
      </span>
      <h1>Set your password.</h1>
      <p>Use at least 12 characters.</p>
      <AuthForm mode="reset" />
    </main>
  );
}
