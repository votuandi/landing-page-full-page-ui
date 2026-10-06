import { PhoneIcon } from "@heroicons/react/24/outline";
import { PRODUCTS } from "@/data/solar";
import LeadForm from "@/components/LeadForm";
import { SITE_CONFIG, telHref } from "@/config/site";
import { makeMetadata } from "@/utils/solar";

export const metadata = makeMetadata(
  "Liên hệ khảo sát & báo giá",
  `Gọi hotline hoặc để lại thông tin, kỹ sư ${SITE_CONFIG.brand.name} sẽ gọi lại tư vấn và hẹn khảo sát miễn phí.`,
  "/lien-he"
);

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ rfq?: string }> }) {
  const { rfq } = await searchParams;
  const selected = rfq ? PRODUCTS.filter((p) => rfq.split(",").includes(p.slug)) : [];
  const message = selected.length ? `Yêu cầu báo giá: ${selected.map((p) => `${p.brand} ${p.name}`).join("; ")}` : "";
  return <main>
    <section className="t5-page-hero">
      <div className="t5-container">
        <span className="t5-eyebrow !border-on-media/20 !bg-on-media/10 !text-highlight">Liên hệ</span>
        <h1 className="t5-page-title">Gửi hóa đơn điện, nhận phương án và báo giá miễn phí.</h1>
        <p className="t5-page-desc">Kỹ sư gọi lại trong giờ làm việc để hỏi thêm về mái, giờ dùng điện và hẹn khảo sát tận nơi.</p>
      </div>
    </section>
    <section className="t5-section">
      <div className="t5-container grid gap-10 lg:grid-cols-[.75fr_1.25fr]">
        <aside className="t8-card p-6">
          <div className="text-xs font-black uppercase tracking-[.18em] text-fg-subtle">{SITE_CONFIG.brand.name}</div>
          <ul className="mt-5 space-y-4">
            {SITE_CONFIG.hotlines.filter((h) => h.phone).map((h) => (
              <li key={h.label}>
                <a href={telHref(h.phone)} className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary"><PhoneIcon className="h-5 w-5" /></span>
                  <span><span className="block text-xs font-bold text-fg-muted">{h.label}</span><span className="text-xl font-black text-fg">{h.phone}</span></span>
                </a>
              </li>
            ))}
          </ul>
          {SITE_CONFIG.contact.email && <a href={`mailto:${SITE_CONFIG.contact.email}`} className="mt-6 block font-bold text-fg">{SITE_CONFIG.contact.email}</a>}
          <p className="mt-3 text-sm leading-7 text-fg-muted">{SITE_CONFIG.contact.address}<br />{SITE_CONFIG.contact.workingHours}</p>
          {selected.length > 0 && <div className="mt-7 border-t border-line/12 pt-5"><div className="text-sm font-black">Sản phẩm đang chọn ({selected.length})</div><ul className="mt-3 space-y-2 text-sm text-fg-muted">{selected.map((p) => <li key={p.slug}>• {p.brand} {p.name}</li>)}</ul></div>}
        </aside>
        <div className="t8-card p-6 sm:p-8"><LeadForm source={selected.length ? "rfq" : "contact"} defaultMessage={message} /></div>
      </div>
    </section>
  </main>;
}
