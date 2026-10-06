import Image from "next/image";
import { COPY, IMAGES, TEAM } from "@/content/site";
import { makeMetadata } from "@/utils/solar";
import { Counters } from "@/components/template10/Proof";
import { Process, Trust, SectionTitle } from "@/components/template10/Sections";
import ContactSection from "@/components/template10/ContactSection";
export const metadata = makeMetadata(
  COPY.about.title,
  COPY.seo.aboutDescription,
  "/about-us",
  IMAGES.technicians.src,
);
export default function Page() {
  return (
    <main>
      <section className="t5-section solar-hero">
        <div className="t5-container grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h1 className="t5-heading">{COPY.about.title}</h1>
            <p className="t5-subheading">{COPY.about.description}</p>
            <p className="mt-5 text-xs text-slate-600">{COPY.demo}</p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[28px]">
            <Image
              src={IMAGES.technicians.src}
              alt={IMAGES.technicians.alt}
              priority
              fill
              sizes="(min-width:1024px) 580px, 95vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>
      <Counters />
      <section className="t5-section">
        <div className="t5-container">
          <SectionTitle
            title={COPY.about.storyTitle}
            description={COPY.about.storyText}
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {COPY.about.certificates.map((c) => (
              <p key={c} className="t8-card p-6 text-sm leading-7">
                {c}
              </p>
            ))}
          </div>
        </div>
      </section>
      <Process />
      <section className="t5-section">
        <div className="t5-container">
          <SectionTitle title={COPY.about.teamTitle} description={COPY.demo} />
          <div className="grid gap-5 md:grid-cols-3">
            {TEAM.map((m) => (
              <article key={m.name} className="t8-card p-7">
                <Image
                  src={m.image}
                  alt={`${COPY.imageNote}: ${m.name}`}
                  width={160}
                  height={160}
                  className="rounded-full"
                />
                <h3 className="mt-5 text-xl font-black">{m.name}</h3>
                <p className="mt-2 text-sm text-slate-600">{m.role}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <Trust />
      <ContactSection />
    </main>
  );
}
