import { AuthForm } from "@/components/auth-form";
export default function ResetPassword() {
  return (
    <main className="standalone auth-card">
      <span className="eyebrow">ACCOUNT RECOVERY</span>
      <h1>Set your password.</h1>
      <p>Use at least 12 characters.</p>
      <AuthForm mode="reset" />
    </main>
  );
}
