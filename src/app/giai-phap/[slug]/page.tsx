import { notFound } from "next/navigation";
import { SEGMENTS, SEGMENT_IDS } from "@/content/site";
import { makeMetadata } from "@/utils/solar";
import Hero from "@/components/template10/Hero";
import {
  SegmentBenefits,
  CaseStudies,
  Finance,
  Process,
  Partners,
  FAQ,
  Trust,
  Monitoring,
} from "@/components/template10/Sections";
import { Reviews } from "@/components/template10/Proof";
import Calculator from "@/components/template10/Calculator";
import ContactSection from "@/components/template10/ContactSection";
export function generateStaticParams() {
  return SEGMENT_IDS.map((s) => ({ slug: SEGMENTS[s].slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const id = SEGMENT_IDS.find((s) => SEGMENTS[s].slug === slug);
  if (!id) return {};
  const s = SEGMENTS[id];
  return makeMetadata(
    s.metaTitle,
    s.metaDescription,
    `/giai-phap/${slug}`,
    s.image.src,
  );
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const id = SEGMENT_IDS.find((s) => SEGMENTS[s].slug === slug);
  if (!id) notFound();
  return (
    <main>
      <Hero fixed={id} />
      <SegmentBenefits segment={id} />
      <CaseStudies segment={id} />
      <Finance />
      <Calculator fixed={id} />
      {id !== "home" && <Monitoring />}
      <Process />
      <Reviews segment={id} />
      <Partners />
      <Trust />
      <FAQ segment={id} />
      <ContactSection segment={id} />
    </main>
  );
}
