import { FAQS } from "@/data/solar";
import HomeT8 from "@/components/HomeT8";
import { makeMetadata } from "@/utils/solar";
import { SITE_CONFIG } from "@/config/site";

export const metadata = makeMetadata(
  `${SITE_CONFIG.brand.name} | Điện mặt trời cho gia đình, cửa hàng & nhà xưởng`,
  "Dự toán chi phí lắp điện mặt trời miễn phí trong 30 giây. Gói giải pháp cho hộ gia đình, cửa hàng và nhà xưởng, trả góp hoặc lắp đặt 0 đồng.",
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
    <HomeT8 />
  </>;
}