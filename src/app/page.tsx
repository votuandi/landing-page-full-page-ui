import { FAQS } from "@/data/solar";
import SolarHomePage from "@/components/SolarHomePage";
import { makeMetadata } from "@/utils/solar";

export const metadata = makeMetadata(
  "Điện mặt trời cho nhà máy, cửa hàng & gia đình",
  "Giải pháp điện mặt trời cho nhà máy, cửa hàng và hộ gia đình. Ước tính tiết kiệm điện, theo dõi năng lượng 24/7 và đồng hành từ lắp đặt đến bảo trì.",
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
    <SolarHomePage />
  </>;
}