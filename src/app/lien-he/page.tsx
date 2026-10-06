import { PRODUCTS } from "@/data/solar";
import LeadForm from "@/components/LeadForm";
import { SITE_CONFIG } from "@/config/site";
import { makeMetadata } from "@/utils/solar";

export const metadata = makeMetadata(
  "Liên hệ khảo sát & yêu cầu báo giá",
  `Gửi thông tin công trình hoặc danh sách thiết bị cần báo giá cho ${SITE_CONFIG.brand.name}.`,
  "/lien-he"
);

export default async function ContactPage({ searchParams }: { searchParams:Promise<{rfq?:string}> }) {
  const { rfq } = await searchParams;
  const selected = rfq ? PRODUCTS.filter((p) => rfq.split(",").includes(p.slug)) : [];
  const message = selected.length ? `Yêu cầu báo giá: ${selected.map((p) => `${p.brand} ${p.name}`).join("; ")}` : "";
  return <main>
    <section className="t5-page-hero t12-invert"><div className="t5-container"><span className="t5-eyebrow">Liên hệ dự án</span><h1 className="t5-page-title">Khảo sát miễn phí, báo giá rõ ràng.</h1><p className="t5-page-desc">Gửi tiền điện hằng tháng, loại mái và diện tích mái — kỹ sư sẽ gọi lại tư vấn trong giờ làm việc.</p></div></section>
    <section className="t5-section"><div className="t5-container grid gap-10 lg:grid-cols-[.75fr_1.25fr]"><aside className="t8-card h-fit p-6"><div className="text-xs font-black uppercase tracking-[.18em] text-fg-subtle">{SITE_CONFIG.brand.name}</div>{SITE_CONFIG.contact.phoneRaw && <a href={`tel:${SITE_CONFIG.contact.phoneRaw}`} className="mt-6 block text-3xl font-black text-primary">{SITE_CONFIG.contact.phone}</a>}<a href={`mailto:${SITE_CONFIG.contact.email}`} className="mt-3 block font-bold">{SITE_CONFIG.contact.email}</a><p className="mt-5 text-sm leading-7 text-fg-muted">{SITE_CONFIG.contact.address}<br />{SITE_CONFIG.contact.workingHours}</p>{selected.length > 0 && <div className="mt-7 border-t border-line/12 pt-5"><div className="text-sm font-black">RFQ đang chọn ({selected.length})</div><ul className="mt-3 space-y-2 text-sm text-fg-muted">{selected.map((p) => <li key={p.slug}>• {p.brand} {p.name}</li>)}</ul></div>}</aside><div className="t8-card p-6 md:p-8"><LeadForm source={selected.length ? "rfq" : "contact"} defaultMessage={message} withMessage /></div></div></section>
  </main>;
}