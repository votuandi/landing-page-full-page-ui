import { FAQS } from "@/data/solar";
import HomeT5 from "@/components/HomeT5";
import { makeMetadata } from "@/utils/solar";

export const metadata = makeMetadata(
  "Minwy Solar | Điện mặt trời nhà xưởng & doanh nghiệp",
  "Giải pháp điện mặt trời C&I tập trung vào tỷ lệ tự dùng, ROI, an toàn thi công và O&M dài hạn.",
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
    <HomeT5 />
  </>;
}