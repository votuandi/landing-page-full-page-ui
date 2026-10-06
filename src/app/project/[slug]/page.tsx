import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CASE_STUDIES, COPY } from "@/content/site";
import { makeMetadata } from "@/utils/solar";
import { CaseStudies, SectionTitle } from "@/components/template10/Sections";
import ContactSection from "@/components/template10/ContactSection";
export function generateStaticParams() {
  return CASE_STUDIES.map((c) => ({ slug: c.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = CASE_STUDIES.find((c) => c.slug === slug);
  return c
    ? makeMetadata(c.name, c.detail, `/project/${slug}`, c.image.src)
    : {};
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = CASE_STUDIES.find((c) => c.slug === slug);
  if (!c) notFound();
  return (
    <main>
      <section className="t5-section solar-hero">
        <div className="t5-container grid items-center gap-9 lg:grid-cols-2">
          <div>
            <Link href="/#du-an" className="t5-button t5-button-secondary">
              ← {COPY.backProjects}
            </Link>
            <p className="mt-7 text-sm font-bold text-blue-900">
              {c.industry} · {c.province}
            </p>
            <h1 className="t5-heading">{c.name}</h1>
            <p className="mt-5 text-xs text-slate-600">{COPY.demo}</p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[28px]">
            <Image
              src={c.image.src}
              alt={c.image.alt}
              fill
              priority
              sizes="(min-width:1024px) 580px, 95vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>
      <section className="t5-section">
        <div className="t5-container">
          <dl className="grid gap-4 sm:grid-cols-3">
            {[
              [COPY.capacity, `${c.kwp.toLocaleString("vi-VN")} kWp`],
              [COPY.saving, `${c.savingPercent}%`],
              [
                COPY.payback,
                `${c.paybackYears.toLocaleString("vi-VN")} ${COPY.years}`,
              ],
            ].map(([k, v]) => (
              <div key={k} className="t8-card p-7">
                <dt className="text-sm text-slate-600">{k}</dt>
                <dd className="mt-3 text-3xl font-black text-blue-900">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-sm leading-7 text-slate-600">
            {COPY.conditions}
          </p>
          <div className="mt-14 grid gap-8 lg:grid-cols-2">
            <div>
              <SectionTitle title={COPY.detailTitle} description={c.detail} />
            </div>
            <div className="t8-card p-8">
              <h2 className="font-bold text-blue-900">{COPY.quoteTitle}</h2>
              <blockquote className="mt-5 text-xl leading-9">
                “{c.quote}”
              </blockquote>
            </div>
          </div>
        </div>
      </section>
      <ContactSection
        segment={c.segment}
        defaultMessage={`${COPY.similarCta}: ${c.name}`}
      />
      <CaseStudies segment={c.segment} />
    </main>
  );
}
