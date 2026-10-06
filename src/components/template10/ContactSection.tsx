import { COPY, SITE_CONFIG, type Segment } from "@/content/site";
import LeadForm from "@/components/LeadForm";
export default function ContactSection({
  segment,
  defaultMessage,
}: {
  segment?: Segment;
  defaultMessage?: string;
}) {
  return (
    <section id="lien-he" className="t5-section solar-hero">
      <div className="t5-container grid gap-9 lg:grid-cols-[.85fr_1.15fr]">
        <div>
          <p className="t5-eyebrow">{COPY.contact.eyebrow}</p>
          <h2 className="t5-heading">{COPY.contact.title}</h2>
          <p className="t5-subheading">{COPY.contact.description}</p>
          <a
            href={`tel:${SITE_CONFIG.contact.phoneRaw}`}
            className="mt-8 inline-flex min-h-11 items-center text-2xl font-black text-blue-900"
          >
            {SITE_CONFIG.contact.phone}
          </a>
          <p className="mt-4 text-xs leading-6 text-slate-600">{COPY.demo}</p>
        </div>
        <LeadForm defaultSegment={segment} defaultMessage={defaultMessage} />
      </div>
    </section>
  );
}
