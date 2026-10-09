import { FAQS } from "@/data/faq";
import HomePage from "@/components/HomePage";
import { makeMetadata } from "@/utils/solar";
import { siteConfig } from "@/config/site.config";

export const metadata = makeMetadata(
  `${siteConfig.brand.name} | Năng lượng xanh — thiết bị điện mặt trời & lắp đặt trọn gói`,
  "Nhà phân phối tấm pin, inverter, pin lưu trữ, BESS, đèn năng lượng mặt trời chính hãng và tổng thầu EPC cho hộ gia đình, cửa hàng, nhà xưởng, trang trại. Video công trình thật, dự toán chi phí trong 30 giây.",
  "/"
);

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  // Chỉ gồm các câu hỏi đang hiển thị trên trang (FAQ chung + hỏi đáp đại lý)
  mainEntity: [
    ...(siteConfig.faq.enabled ? FAQS : []),
    ...(siteConfig.dealer.enabled ? siteConfig.dealer.faqs : []),
  ].map(([question, answer]) => ({
    "@type": "Question", name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
};

export default function Page() {
  return <>
    {faqSchema.mainEntity.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
    <HomePage />
  </>;
}
