import { loadPreset } from "@solar/presets";
import { sectionRegistry } from "@solar/sections";
import PresetPage from "@/components/PresetPage";
import { makeMetadata } from "@/utils/solar";
import { siteConfig } from "@/config/site.config";

export const metadata = makeMetadata(
  `${siteConfig.brand.name} | Năng lượng xanh — thiết bị điện mặt trời & lắp đặt trọn gói`,
  "Nhà phân phối tấm pin, inverter, pin lưu trữ, BESS, đèn năng lượng mặt trời chính hãng và tổng thầu EPC cho hộ gia đình, cửa hàng, nhà xưởng, trang trại. Video công trình thật, dự toán chi phí trong 30 giây.",
  "/"
);

export default function Page() {
  const loaded = loadPreset("t15");
  const faq = loaded.page.sections.find((section) => section.type === "faq" && section.enabled);
  const dealer = loaded.page.sections.find((section) => section.type === "dealer" && section.enabled);
  const items = [
    ...(faq ? sectionRegistry.types.faq.schema.parse(faq.data).items : []),
    ...(dealer ? sectionRegistry.types.dealer.schema.parse(dealer.data).faqs : []),
  ];
  const faqSchema = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: items.map(({ question, answer }) => ({
      "@type": "Question", name: question.vi, acceptedAnswer: { "@type": "Answer", text: answer.vi },
    })),
  };
  return <>
    {items.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }} />}
    <PresetPage loaded={loaded} site={{ tenantId: "preset-demo", locale: "vi", themeId: loaded.theme.meta.id }} />
  </>;
}
