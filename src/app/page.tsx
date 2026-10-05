import { FAQS } from "@/data/solar";
import IndustrialSolarHomepage from "@/components/IndustrialSolarHomepage";
import { makeMetadata } from "@/utils/solar";

export const metadata = makeMetadata(
  "Minwy Solar | Industrial Solar Engineering & Investment",
  "Giải pháp điện mặt trời công nghiệp theo hướng engineering-first: phân tích phụ tải 24h, single-line system, monitoring và financial proposal cho doanh nghiệp.",
  "/"
);

const faqSchema = {
  "@context":"https://schema.org",
  "@type":"FAQPage",
  mainEntity: FAQS.map(([question,answer]) => ({
    "@type":"Question", name:question,
    acceptedAnswer:{ "@type":"Answer", text:answer }
  }))
};

export default function Page() {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html:JSON.stringify(faqSchema) }} />
    <IndustrialSolarHomepage />
  </>;
}
