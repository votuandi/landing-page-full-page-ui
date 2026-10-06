import LeadForm from "@/components/LeadForm";
import {
  COPY,
  CALCULATOR,
  PRODUCTS,
  SEGMENT_IDS,
  SITE_CONFIG,
  type Segment,
  type Region,
} from "@/content/site";
import { estimateMessage } from "@/utils/estimate";
import { makeMetadata } from "@/utils/solar";
export const metadata = makeMetadata(
  COPY.contact.title,
  COPY.seo.contactDescription,
  "/contact-us",
);
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const q = await searchParams;
  const segment = SEGMENT_IDS.includes(q.segment as Segment)
    ? (q.segment as Segment)
    : null;
  let message = "";
  if (
    segment &&
    typeof q.region === "string" &&
    Object.keys(CALCULATOR.regions).includes(q.region) &&
    (q.mode === "bill" || q.mode === "roof") &&
    typeof q.value === "string"
  )
    message = estimateMessage({
      segment,
      region: q.region as Region,
      mode: q.mode,
      value: Number(q.value),
    });
  if (typeof q.rfq === "string") {
    const p = PRODUCTS.filter((p) => q.rfq?.includes(p.slug));
    if (p.length)
      message +=
        "\n" + COPY.shell.rfqPrefix + "\n" + p.map((p) => p.name).join("\n");
  }
  return (
    <main>
      <section className="t5-section solar-hero">
        <div className="t5-container grid gap-10 lg:grid-cols-2">
          <div>
            <p className="t5-eyebrow">{COPY.contact.eyebrow}</p>
            <h1 className="t5-heading">{COPY.contact.title}</h1>
            <p className="t5-subheading">{COPY.contact.description}</p>
            <a
              href={`tel:${SITE_CONFIG.contact.phoneRaw}`}
              className="mt-8 inline-flex min-h-11 items-center text-2xl font-black text-blue-900"
            >
              {SITE_CONFIG.contact.phone}
            </a>
            <p className="mt-5 text-sm leading-7 text-slate-600">
              {SITE_CONFIG.contact.address}
            </p>
          </div>
          <LeadForm defaultSegment={segment} defaultMessage={message.trim()} />
        </div>
      </section>
    </main>
  );
}
