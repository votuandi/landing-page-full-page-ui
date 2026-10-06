import { FAQS } from "@/data/faq";
import { SITE_CONFIG } from "@/config/site";
import HomeT8 from "@/components/HomeT8";
import { makeMetadata } from "@/utils/solar";

export const metadata = makeMetadata(
  `${SITE_CONFIG.brand.name} | Lắp điện mặt trời cho gia đình, cửa hàng, nhà xưởng, trang trại`,
  "Lắp đặt điện mặt trời trọn gói và thiết bị, đèn năng lượng mặt trời chính hãng. Xem video công trình thật, dự toán chi phí và tiền tiết kiệm trong 30 giây.",
  "/"
);

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map(([question, answer]) => ({
    "@type": "Question", name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
};

export default function Page() {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    <HomeT8 />
  </>;
}
