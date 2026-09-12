import { Scissors, ArrowUpRight } from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { demoSignIn } from "@/modules/identity/actions";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; demo?: string }>;
}) {
  const params = await searchParams;
  const demo =
    process.env.NODE_ENV === "development" && process.env.LOCAL_DEMO === "true";
  return (
    <main className="login-page">
      <section className="login-story">
        <div className="wordmark">
          barbershop<span>os</span>
        </div>
        <div className="login-statement">
          <Scissors size={36} strokeWidth={1} />
          <h1>
            Great shops are
            <br />
            built on good
            <br />
            <em>relationships.</em>
          </h1>
          <p>
            A little less admin.
            <br />A little more time for your craft.
          </p>
        </div>
        <span className="login-footnote">
          YOUR BUSINESS. YOUR CUSTOMERS. YOUR WAY.
        </span>
      </section>
      <section className="login-panel">
        <div className="login-form">
          <span className="eyebrow">BACK TO YOUR BUSINESS</span>
          <h2>Welcome back.</h2>
          <p>Make yourself at home.</p>
          {params.reset === "success" && (
            <p role="status" className="notice success">
              Password updated. Sign in with your new password.
            </p>
          )}
          {params.demo && (
            <p role="alert" className="notice failure">
              The local demo account is not ready. Run the user seed described
              in README.md.
            </p>
          )}
          <AuthForm />
          {demo && (
            <div className="demo-login">
              <span>TAKE A LOOK AROUND</span>
              <form action={demoSignIn}>
                <button className="button secondary">
                  Open Porto Gentlemen demo <ArrowUpRight size={17} />
                </button>
              </form>
              <p>
                A fictional shop. Real working software.
                <br />
                Synthetic data, saved only in this local environment.
              </p>
            </div>
          )}
          <p className="auth-footer">
            Access is by invitation from your business owner.
          </p>
        </div>
      </section>
    </main>
  );
}
