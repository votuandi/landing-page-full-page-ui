import { COPY } from "@/content/site";
import Hero from "@/components/template10/Hero";
import {
  Solutions,
  CaseStudies,
  Finance,
  Process,
  Partners,
  FAQ,
  Trust,
  Monitoring,
} from "@/components/template10/Sections";
import { ClientWall, Counters, Reviews } from "@/components/template10/Proof";
import Calculator from "@/components/template10/Calculator";
import ContactSection from "@/components/template10/ContactSection";
import { makeMetadata } from "@/utils/solar";
export const metadata = makeMetadata(
  COPY.seo.homeTitle,
  COPY.seo.homeDescription,
  "/",
);
export default function Page() {
  return (
    <main>
      <Hero />
      <Solutions />
      <ClientWall />
      <Counters />
      <CaseStudies />
      <Partners />
      <Calculator />
      <Finance />
      <Monitoring />
      <Process />
      <Reviews />
      <Trust />
      <FAQ />
      <ContactSection />
    </main>
  );
}
