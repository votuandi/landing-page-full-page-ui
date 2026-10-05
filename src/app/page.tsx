import { FAQS } from "@/data/solar";
import IndustrialSolarHomepage from "@/components/IndustrialSolarHomepage";
import { makeMetadata } from "@/utils/solar";

export const metadata = makeMetadata(
  "Minwy Solar | Kỹ thuật & đầu tư điện mặt trời công nghiệp",
  "Giải pháp điện mặt trời công nghiệp theo hướng ưu tiên kỹ thuật: phân tích phụ tải 24 giờ, sơ đồ một sợi, giám sát vận hành và hồ sơ tài chính cho doanh nghiệp.",
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
