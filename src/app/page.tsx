import { FAQS } from "@/data/solar";
import HomeT14 from "@/components/HomeT14";
import { makeMetadata } from "@/utils/solar";
import { siteConfig } from "@/config/site.config";

export const metadata = makeMetadata(
  `${siteConfig.brand.name} | Phân phối thiết bị & tổng thầu EPC điện mặt trời`,
  "Nhà phân phối tấm pin, inverter, pin lithium, BESS chính hãng đủ CO/CQ và tổng thầu EPC điện mặt trời. Bảng giá lắp đặt theo tiền điện, dự toán miễn phí trong 30 giây.",
  "/"
);

const faqSchema = {
  "@context":"https://schema.org",
  "@type":"FAQPage",
  // Chỉ gồm các câu hỏi đang hiển thị trên trang (FAQ chung + hỏi đáp đại lý)
  mainEntity: [
    ...(siteConfig.faq.enabled ? FAQS : []),
    ...(siteConfig.dealer.enabled ? siteConfig.dealer.faqs : []),
  ].map(([question,answer]) => ({
    "@type":"Question", name:question,
    acceptedAnswer:{ "@type":"Answer", text:answer }
  }))
};

export default function Page() {
  return <>
    {faqSchema.mainEntity.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html:JSON.stringify(faqSchema) }} />}
    <HomeT14 />
  </>;
}