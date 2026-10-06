import {
  getAssumptions,
  getBrand,
  getCopy,
  getPricing,
  getPvout,
} from "../content/solar";
import { estimate, money, number } from "./solar-calc";
export function getSeoContent() {
  const brand = getBrand(),
    a = getAssumptions(),
    packages = getPricing(),
    province = getPvout().find((p) => p.id === a.defaultProvince)!;
  const lowestPrice = Math.min(...packages.map((p) => p.price));
  const paybacks = packages
    .map((p) => estimate(p, province, a).paybackYears)
    .filter((v): v is number => v !== null);
  return {
    title: `${brand.name} | Điện mặt trời · gói mẫu từ ${money(lowestPrice)}`,
    description: `So sánh hòa lưới và hybrid cho nhà xưởng, cửa hàng, hộ gia đình. Giá mẫu từ ${money(lowestPrice)}, hoàn vốn mô phỏng từ ${number(Math.min(...paybacks))} năm tại ${province.name}; cần khảo sát trước khi báo giá.`,
  };
}
export function getFaqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: getCopy().faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}
export function getBusinessSchema(url: string) {
  const b = getBrand();
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: b.name,
    url,
    telephone: b.hotlines[0].phone,
    email: b.email,
    ...(b.address.includes("[CẦN XÁC MINH]")
      ? {}
      : {
          address: {
            "@type": "PostalAddress",
            streetAddress: b.address,
            addressCountry: "VN",
          },
        }),
    ...(b.socials.length ? { sameAs: b.socials.map((s) => s.url) } : {}),
    areaServed: "VN",
    description: b.slogan,
  };
}
export const serializeSchema = (value: unknown) =>
  JSON.stringify(value).replace(/</g, "\\u003c");
