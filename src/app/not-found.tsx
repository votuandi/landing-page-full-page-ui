import Link from "next/link";
import { COPY } from "@/content/site";
export default function Page() {
  return (
    <main className="t5-section solar-hero">
      <div className="t5-container">
        <p className="text-6xl font-black text-blue-900">404</p>
        <h1 className="t5-heading">{COPY.notFound.title}</h1>
        <p className="t5-subheading">{COPY.notFound.description}</p>
        <Link href="/" className="t5-button t5-button-primary mt-8">
          {COPY.notFound.cta}
        </Link>
      </div>
    </main>
  );
}
