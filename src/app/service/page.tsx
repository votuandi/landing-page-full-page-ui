import { COPY } from "@/content/site";
import { Solutions, FAQ } from "@/components/template10/Sections";
import ContactSection from "@/components/template10/ContactSection";
import { makeMetadata } from "@/utils/solar";
export const metadata = makeMetadata(
  COPY.solutionTitle,
  COPY.solutionDescription,
  "/service",
);
export default function Page() {
  return (
    <main>
      <section className="t5-page-hero">
        <div className="t5-container">
          <h1 className="t5-page-title">{COPY.solutionTitle}</h1>
          <p className="t5-page-desc">{COPY.solutionDescription}</p>
        </div>
      </section>
      <Solutions />
      <FAQ />
      <ContactSection />
    </main>
  );
}
