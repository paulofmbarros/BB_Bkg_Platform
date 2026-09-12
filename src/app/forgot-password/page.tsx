import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
export default function ForgotPassword() {
  return (
    <main className="standalone auth-card">
      <span className="eyebrow">ACCOUNT RECOVERY</span>
      <h1>A fresh start.</h1>
      <p>We’ll send a link to reset your password.</p>
      <AuthForm mode="recovery" />
      <Link href="/login" className="text-link">
        Back to sign in
      </Link>
    </main>
  );
}
