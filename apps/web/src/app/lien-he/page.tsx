import { ArrowTopRightOnSquareIcon, ClockIcon, EnvelopeIcon, MapPinIcon, PhoneIcon } from "@heroicons/react/24/outline";
import LeadForm from "@/components/LeadForm";
import { SITE_CONFIG, mapsUrl, primaryBranch, telHref, zaloHref } from "@/config/site";
import { siteConfig } from "@/config/site.config";
import { makeMetadata } from "@/utils/solar";
import { ZaloIcon } from "@/components/BrandIcons";

export const metadata = makeMetadata(
  "Liên hệ khảo sát & báo giá",
  `Gọi hotline theo nhu cầu hoặc để lại thông tin, kỹ sư ${SITE_CONFIG.brand.name} gọi lại tư vấn và hẹn khảo sát miễn phí.`,
  "/lien-he"
);

/** Hotline theo mục đích (template-13) lấy từ chi nhánh chính + khiếu nại; danh sách chi nhánh (template-14). */
const HOTLINES = [
  { label: "Tổng đài", phone: primaryBranch.hotline.main },
  { label: "Tư vấn hộ gia đình", phone: primaryBranch.hotline.household },
  { label: "Dự án doanh nghiệp", phone: primaryBranch.hotline.project },
  { label: "Khiếu nại – góp ý", phone: siteConfig.complaintHotline },
];

export default function ContactPage() {
  return <main>
    <section className="t15-page-hero">
      <div className="t15-container">
        <span className="t15-eyebrow">Liên hệ</span>
        <h1 className="t15-page-title">Gửi hóa đơn điện, nhận phương án và báo giá miễn phí.</h1>
        <p className="t15-page-desc">Gửi tiền điện hằng tháng, loại mái và diện tích mái — kỹ sư gọi lại trong {SITE_CONFIG.callbackHours} giờ làm việc để tư vấn và hẹn khảo sát tận nơi.</p>
      </div>
    </section>
    <section className="t15-section">
      <div className="t15-container grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
        <aside className="grid content-start gap-5">
          <div className="t15-card p-6">
            <div className="text-xs font-black uppercase tracking-[.18em] text-fg-subtle">{SITE_CONFIG.brand.name}</div>
            <ul className="mt-5 space-y-4">
              {HOTLINES.map((h) => (
                <li key={h.label}>
                  <a href={telHref(h.phone)} className="group flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-on-primary"><PhoneIcon className="h-5 w-5" /></span>
                    <span><span className="block text-xs font-bold text-fg-muted">{h.label}</span><span className="text-xl font-black tabular-nums text-fg">{h.phone}</span></span>
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-6 grid gap-2 text-sm text-fg-muted">
              <a href={`mailto:${SITE_CONFIG.contact.email}`} className="flex items-center gap-2 font-bold text-fg hover:text-primary"><EnvelopeIcon className="h-4 w-4" />{SITE_CONFIG.contact.email}</a>
              <span className="flex items-center gap-2"><ClockIcon className="h-4 w-4" />{SITE_CONFIG.contact.workingHours}</span>
              <a href={SITE_CONFIG.contact.zalo} target="_blank" rel="noopener noreferrer" className="t15-button t15-button-secondary mt-3"><ZaloIcon className="h-5 w-5" />Chat Zalo</a>
            </div>
          </div>
          <div className="t15-card p-6">
            <h2 className="text-lg font-black text-fg">Hệ thống chi nhánh</h2>
            <ul className="mt-4 grid gap-3">
              {siteConfig.branches.map((b) => (
                <li key={b.id} className="rounded-2xl bg-bg-tint p-4 text-sm">
                  <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5 font-black text-fg"><MapPinIcon className="h-4 w-4 text-primary" />{b.name}</span><a href={telHref(b.hotline.main)} className="font-black tabular-nums text-primary">{b.hotline.main}</a></div>
                  <p className="mt-1 text-xs leading-5 text-fg-muted">{b.office.address}</p>
                  <div className="mt-2 flex gap-4 text-xs font-bold">
                    <a href={mapsUrl(b.office)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-secondary hover:underline">Google Maps <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" /></a>
                    <a href={zaloHref(b.hotline.main)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-secondary hover:underline"><ZaloIcon className="h-3.5 w-3.5" />Zalo</a>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
        <div className="t15-card h-fit p-6 sm:p-8">
          <h2 className="mb-5 text-2xl font-black text-fg">Yêu cầu tư vấn & báo giá</h2>
          <LeadForm source="contact" fields={{ zalo: true, address: true, message: true }} submitLabel="Gửi yêu cầu tư vấn" />
          <p className="mt-6 rounded-2xl bg-bg-sun p-4 text-sm leading-6 text-fg-muted">Cần báo giá thiết bị? Thêm sản phẩm vào <strong className="text-fg">giỏ yêu cầu báo giá</strong> ở trang Sản phẩm để gửi một lần cho cả cấu hình.</p>
        </div>
      </div>
    </section>
  </main>;
}
