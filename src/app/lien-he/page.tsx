import { PRODUCTS } from "@/data/solar";
import LeadForm from "@/components/LeadForm";
import { SITE_CONFIG } from "@/config/site";
import { makeMetadata } from "@/utils/solar";

export const metadata = makeMetadata(
  "Liên hệ khảo sát & yêu cầu báo giá",
  "Gửi thông tin công trình hoặc danh sách thiết bị cần báo giá cho đội dự án Minwy Solar.",
  "/lien-he"
);

export default async function ContactPage({ searchParams }: { searchParams:Promise<{rfq?:string}> }) {
  const { rfq } = await searchParams;
  const selected = rfq ? PRODUCTS.filter((p) => rfq.split(",").includes(p.slug)) : [];
  const message = selected.length ? `Yêu cầu báo giá: ${selected.map((p) => `${p.brand} ${p.name}`).join("; ")}` : "";
  return <main>
    <section className="t5-page-hero"><div className="t5-container"><span className="t5-eyebrow !text-accent">Liên hệ dự án</span><h1 className="t5-page-title">Cho chúng tôi dữ liệu đầu vào. Nhận lại một cuộc trao đổi có số liệu.</h1><p className="t5-page-desc">Có thể gửi tiền điện, loại mái, diện tích mái, giờ vận hành hoặc danh sách thiết bị RFQ.</p></div></section>
    <section className="t5-section"><div className="t5-container grid gap-10 lg:grid-cols-[.75fr_1.25fr]"><aside className="border border-line/12 bg-bg-elevated p-6"><div className="text-xs font-black uppercase tracking-[.18em] text-fg-subtle">Minwy Solar</div><div className="mt-6 text-3xl font-black text-primary">{SITE_CONFIG.contact.phone}</div><a href={`mailto:${SITE_CONFIG.contact.email}`} className="mt-3 block font-bold">{SITE_CONFIG.contact.email}</a><p className="mt-5 text-sm leading-7 text-fg-muted">{SITE_CONFIG.contact.address}</p>{selected.length > 0 && <div className="mt-7 border-t border-line/12 pt-5"><div className="text-sm font-black">RFQ đang chọn ({selected.length})</div><ul className="mt-3 space-y-2 text-sm text-fg-muted">{selected.map((p) => <li key={p.slug}>• {p.brand} {p.name}</li>)}</ul></div>}</aside><div><LeadForm source={selected.length ? "rfq" : "contact"} defaultMessage={message} /></div></div></section>
  </main>;
}