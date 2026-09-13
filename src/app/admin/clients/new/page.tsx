import Link from "next/link";
import { NewPlatformClientForm } from "@/components/platform-forms";
export default function NewClientPage() {
  return (
    <>
      <Link className="text-link" href="/admin">
        ← All clients
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">A NEW BEGINNING</span>
          <h1>Add a barbershop.</h1>
          <p>Create a private workspace for your next client.</p>
        </div>
      </div>
      <section className="panel platform-narrow">
        <NewPlatformClientForm />
      </section>
    </>
  );
}
