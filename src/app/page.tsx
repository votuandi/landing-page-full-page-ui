import { FAQS } from "@/data/solar";
import SolarHome from "@/components/solar/SolarHome";
import { makeMetadata } from "@/utils/solar";

export const metadata = makeMetadata(
  "Minwy Solar | Điện mặt trời cho nhà máy, cửa hàng & gia đình",
  "Giải pháp điện mặt trời tiết kiệm điện cho nhà máy, cửa hàng và hộ gia đình, kèm ứng dụng theo dõi điện năng 24/7.",
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
    <SolarHome />
  </>;
}