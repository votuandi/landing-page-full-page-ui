import Image from "next/image";
import Link from "next/link";
import {
  ASSET_COPY,
  CASE_STUDIES,
  COPY,
  DASHBOARD,
  FAQS,
  FINANCE,
  IMAGES,
  PARTNERS,
  PROCESS_STEPS,
  SEGMENTS,
  SEGMENT_IDS,
  TRUST_BADGES,
  type Segment,
} from "@/content/site";
export function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-9">
      {eyebrow && <p className="t5-eyebrow">{eyebrow}</p>}
      <h2 className="t5-heading">{title}</h2>
      {description && <p className="t5-subheading">{description}</p>}
    </div>
  );
}
export function Solutions() {
  return (
    <section className="t5-section" id="giai-phap">
      <div className="t5-container">
        <SectionTitle
          eyebrow={COPY.solutionEyebrow}
          title={COPY.solutionTitle}
          description={COPY.solutionDescription}
        />
        <div className="grid gap-6 md:grid-cols-3">
          {SEGMENT_IDS.map((s, i) => (
            <article className="t8-card overflow-hidden" key={s}>
              <div className="relative aspect-[4/3]">
                <Image
                  src={SEGMENTS[s].image.src}
                  alt={SEGMENTS[s].image.alt}
                  fill
                  sizes="(min-width:768px) 33vw, 95vw"
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <p className="text-sm font-bold text-blue-800">0{i + 1}</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight">
                  {SEGMENTS[s].fullLabel}
                </h3>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {SEGMENTS[s].description}
                </p>
                <Link
                  href={`/giai-phap/${SEGMENTS[s].slug}`}
                  className="mt-5 inline-flex min-h-11 items-center font-bold text-blue-900"
                >
                  {COPY.solutionMore}
                  <span aria-hidden="true" className="ml-2">
                    ↗
                  </span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
export function SegmentBenefits({ segment }: { segment: Segment }) {
  const s = SEGMENTS[segment];
  return (
    <>
      <section className="t5-section bg-white">
        <div className="t5-container grid gap-10 lg:grid-cols-2">
          <div>
            <SectionTitle title={COPY.painTitle} />
            <ul className="space-y-4">
              {s.pains.map((p, i) => (
                <li
                  className="flex gap-4 rounded-2xl bg-slate-50 p-5 text-slate-700"
                  key={p}
                >
                  <span className="font-black text-blue-900">0{i + 1}</span>
                  <p className="leading-7">{p}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="t8-card p-7 sm:p-10">
            <h2 className="text-3xl font-black tracking-tight">
              {COPY.solutionHeading}
            </h2>
            <p className="mt-6 leading-8 text-slate-600">{s.solution}</p>
            <div className="relative mt-7 aspect-[16/9] overflow-hidden rounded-2xl">
              <Image
                src={
                  (segment === "home" ? IMAGES.storage : IMAGES.technicians).src
                }
                alt={
                  (segment === "home" ? IMAGES.storage : IMAGES.technicians).alt
                }
                fill
                sizes="(min-width:1024px) 520px, 90vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>
      <section className="t5-section">
        <div className="t5-container">
          <SectionTitle eyebrow={COPY.benefits} title={COPY.benefitHeading} />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {s.benefits.map((b) => (
              <article className="t8-card p-7" key={b.title}>
                <p className="text-3xl font-black tracking-tight text-blue-900">
                  {b.value}
                </p>
                <h3 className="mt-5 text-xl font-bold">{b.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {b.text}
                </p>
              </article>
            ))}
          </div>
          <p className="mt-5 text-sm leading-7 text-slate-600">
            {COPY.conditions}
          </p>
        </div>
      </section>
    </>
  );
}
export function CaseStudies({ segment }: { segment?: Segment }) {
  const cases = CASE_STUDIES.filter((c) => !segment || c.segment === segment);
  return (
    <section id="du-an" className="t5-section bg-blue-50/60">
      <div className="t5-container">
        <SectionTitle
          eyebrow={COPY.caseEyebrow}
          title={COPY.caseTitle}
          description={COPY.demo}
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cases.map((c) => (
            <article className="t8-card overflow-hidden" key={c.slug}>
              <Link href={`/project/${c.slug}`} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={c.image.src}
                    alt={c.image.alt}
                    fill
                    sizes="(min-width:1024px) 390px, (min-width:768px) 48vw, 95vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute bottom-4 left-4 rounded-full bg-white px-3 py-1 text-xs font-bold">
                    {c.industry} · {c.province}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-black leading-7">{c.name}</h3>
                  <div className="mt-5 grid grid-cols-3 gap-2 border-y border-slate-200 py-4">
                    {[
                      [`${c.kwp.toLocaleString("vi-VN")} kWp`, COPY.capacity],
                      [`${c.savingPercent}%`, COPY.saving],
                      [
                        `${c.paybackYears.toLocaleString("vi-VN")} ${COPY.years}`,
                        COPY.payback,
                      ],
                    ].map(([v, l]) => (
                      <div key={l}>
                        <p className="text-sm font-black text-blue-900">{v}</p>
                        <p className="mt-1 text-[11px] text-slate-600">{l}</p>
                      </div>
                    ))}
                  </div>
                  <blockquote className="mt-5 text-sm leading-7 text-slate-600">
                    “{c.quote}”
                  </blockquote>
                  <p className="mt-5 font-bold text-blue-900">
                    {COPY.caseMore}
                    <span aria-hidden="true"> ↗</span>
                  </p>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
export function Finance() {
  return (
    <section id="tai-chinh" className="t5-section">
      <div className="t5-container">
        <SectionTitle eyebrow={COPY.financeEyebrow} title={COPY.financeTitle} />
        <div className="grid gap-5 md:grid-cols-3">
          {FINANCE.map((f, i) => (
            <article
              key={f.name}
              className={`t8-card p-7 ${i === 1 ? "border-blue-300 bg-blue-50/70" : ""}`}
            >
              <p className="text-sm font-black text-blue-800">0{i + 1}</p>
              <h3 className="mt-4 text-2xl font-black">{f.name}</h3>
              <dl className="mt-6 space-y-5">
                {(
                  ["investment", "ownership", "advantage", "suitable"] as const
                ).map((k) => (
                  <div key={k}>
                    <dt className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      {COPY.financeLabels[k]}
                    </dt>
                    <dd className="mt-1 text-sm leading-7 text-slate-800">
                      {f[k]}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-5 border-t border-slate-200 pt-4 text-xs leading-6 text-slate-600">
                {f.note}
              </p>
            </article>
          ))}
        </div>
        <p className="mt-5 text-sm text-slate-600">{COPY.conditions}</p>
      </div>
    </section>
  );
}
export function Process() {
  return (
    <section className="t5-section bg-white">
      <div className="t5-container">
        <SectionTitle eyebrow={COPY.processEyebrow} title={COPY.processTitle} />
        <ol className="grid gap-6 md:grid-cols-3">
          {PROCESS_STEPS.map((s, i) => (
            <li
              className="relative border-t-2 border-blue-200 pt-6"
              key={s.title}
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-blue-900 font-black text-white">
                {i + 1}
              </span>
              <h3 className="mt-5 text-xl font-bold">{s.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
export function Trust() {
  return (
    <section className="t5-section">
      <div className="t5-container">
        <SectionTitle title={COPY.trustTitle} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_BADGES.map((b) => (
            <article
              key={b.title}
              className="rounded-2xl border border-blue-200 bg-blue-50 p-6"
            >
              <span aria-hidden="true" className="text-2xl text-blue-900">
                ◇
              </span>
              <h3 className="mt-3 font-bold">{b.title}</h3>
              <p className="mt-3 text-xs leading-6 text-slate-600">{b.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
export function Partners() {
  return (
    <section className="py-12">
      <div className="t5-container">
        <h2 className="text-xl font-bold">{COPY.partnersTitle}</h2>
        <p className="mt-2 text-sm text-slate-600">{COPY.partnersNote}</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PARTNERS.map((p) => (
            <div
              className="flex min-h-24 items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-3"
              key={p.id}
            >
              {p.logo ? (
                <Image
                  src={p.logo}
                  alt={p.label}
                  width={160}
                  height={64}
                  className="h-16 object-contain"
                />
              ) : (
                <>
                  <span className="text-xl text-slate-600" aria-hidden="true">
                    ◇
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-600">
                      {p.label}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">{p.category}</p>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
export function FAQ({ segment }: { segment?: Segment }) {
  const faqs = segment ? [...SEGMENTS[segment].faq, ...FAQS.slice(0, 3)] : FAQS;
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
  return (
    <section className="t5-section bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />
      <div className="t5-container">
        <SectionTitle eyebrow={COPY.faqEyebrow} title={COPY.faqTitle} />
        <div className="max-w-4xl">
          {faqs.map(([q, a]) => (
            <details key={q} className="border-b border-slate-200 py-5">
              <summary className="cursor-pointer pr-4 text-base font-bold leading-7">
                {q}
              </summary>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
                {a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
export function Monitoring() {
  const points = (values: readonly number[]) =>
    values
      .map((v, i) => `${((i * 560) / 23).toFixed(1)},${(200 - v).toFixed(1)}`)
      .join(" ");
  return (
    <section className="t5-section bg-[var(--t8-ink)] text-white">
      <div className="t5-container grid items-center gap-10 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <p className="t5-eyebrow !bg-emerald-100 !text-emerald-950">
            {DASHBOARD.eyebrow}
          </p>
          <h2 className="mt-6 text-4xl font-black leading-tight tracking-tight">
            {DASHBOARD.title}
          </h2>
          <p className="mt-5 leading-8 text-blue-100">
            {DASHBOARD.description}
          </p>
          <p className="mt-6 text-xs text-blue-100">{DASHBOARD.badge}</p>
        </div>
        <div className="rounded-[28px] border border-white/20 bg-white/10 p-5 sm:p-7">
          <div className="grid grid-cols-3 gap-3">
            {DASHBOARD.stats.map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/10 p-3">
                <p className="text-[11px] text-blue-100">{s.label}</p>
                <p className="mt-2 text-base font-black sm:text-xl">
                  {s.value}
                </p>
              </div>
            ))}
          </div>
          <h3 className="mt-7 text-sm font-bold">{DASHBOARD.chartTitle}</h3>
          <svg
            role="img"
            aria-label={DASHBOARD.chartAlt}
            viewBox="-20 -10 610 250"
            className="mt-5 w-full"
          >
            <g stroke="rgba(255,255,255,.14)">
              {[0, 50, 100, 150, 200].map((y) => (
                <line key={y} x1="0" x2="560" y1={y} y2={y} />
              ))}
            </g>
            <polyline
              points={points(DASHBOARD.consumption)}
              fill="none"
              stroke="#8fbdff"
              strokeWidth="3"
            />
            <polygon
              points={`0,200 ${points(DASHBOARD.production)} 560,200`}
              fill="rgba(255,214,102,.15)"
            />
            <polyline
              points={points(DASHBOARD.production)}
              fill="none"
              stroke="#b8efcc"
              strokeWidth="4"
            />
            <g fill="#dbe9ff" fontSize="12">
              <text x="0" y="230">
                {ASSET_COPY.hourLabels[0]}
              </text>
              <text x="265" y="230">
                {ASSET_COPY.hourLabels[1]}
              </text>
              <text x="530" y="230">
                {ASSET_COPY.hourLabels[2]}
              </text>
            </g>
          </svg>
          <div className="flex gap-5 text-xs">
            <span className="text-emerald-200">
              ● {DASHBOARD.productionLabel}
            </span>
            <span className="text-blue-200">
              ● {DASHBOARD.consumptionLabel}
            </span>
          </div>
          <ul className="mt-6 space-y-2">
            {DASHBOARD.sites.map((s) => (
              <li
                className="flex justify-between gap-3 border-t border-white/10 pt-3 text-xs"
                key={s.name}
              >
                <span>{s.name}</span>
                <span className="text-blue-100">{s.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
