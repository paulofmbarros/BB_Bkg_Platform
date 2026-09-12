import Link from "next/link";
export default function NotFound() {
  return (
    <main className="standalone">
      <span className="eyebrow">NOT FOUND</span>
      <h1>This page isn’t available.</h1>
      <p>Check the address or sign in with an account that has access.</p>
      <Link href="/" className="button primary">
        Back to home
      </Link>
    </main>
  );
}
