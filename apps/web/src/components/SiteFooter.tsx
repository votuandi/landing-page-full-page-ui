import { SEGMENT_SLUGS, SEGMENT_ORDER } from "@solar/core";
import Link from "next/link";
import { CheckBadgeIcon, ExclamationCircleIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { siteConfig } from "@/config/site.config";
import { catalogEnabled, telHref, zaloHref } from "@/config/site";
import { SEGMENTS } from "@/config/segments";
import { Tr } from "@/i18n/LangProvider";
import BrandLogo from "@/components/BrandLogo";
import { FacebookIcon, TikTokIcon, YouTubeIcon, ZaloIcon } from "@/components/BrandIcons";

const { brand, legal, branches, complaintHotline, workingHours, socials } = siteConfig;
const SOCIAL_ICONS = { facebook: FacebookIcon, youtube: YouTubeIcon, tiktok: TikTokIcon, zalo: ZaloIcon } as const;

/** Badge "Đã thông báo Bộ Công Thương" — PLACEHOLDER (không dùng logo thật). Có URL xác nhận thì thành link. */
function MoitBadge() {
  if (!legal.moitBadge.enabled) return null;
  const body = (
    <span className="inline-flex items-center gap-2.5 rounded-2xl border-2 border-dashed border-line/25 bg-glass px-3 py-2">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/20 text-primary"><CheckBadgeIcon className="h-6 w-6" /></span>
      <span className="text-[11px] font-black uppercase leading-tight tracking-wide text-fg">
        <Tr vi="Đã thông báo" en="Notified to" /><br /><Tr vi="Bộ Công Thương" en="Ministry of Industry & Trade" />
        <span className="block text-[9px] font-bold normal-case tracking-normal text-fg-subtle">(placeholder)</span>
      </span>
    </span>
  );
  return legal.moitBadge.url ? <a href={legal.moitBadge.url} target="_blank" rel="noopener noreferrer">{body}</a> : body;
}

/** Footer render phía server; chữ song ngữ dùng <Tr>. Nền tối "Ocean Forest". */
export default function SiteFooter() {
  const links = socials.filter((s) => s.url);
  return (
    <footer className="t15-invert t15-ocean relative overflow-hidden text-fg">
      <div aria-hidden className="t15-energy-line h-1 w-full" />
      <div aria-hidden className="t15-dots pointer-events-none absolute inset-0 opacity-60 [mask-image:linear-gradient(180deg,transparent,rgb(0_0_0)_40%,transparent)]" />
      <div className="t15-container relative grid gap-10 py-16 lg:grid-cols-[1.1fr_2fr_.9fr]">
        {/* Thương hiệu + pháp lý */}
        <div>
          <BrandLogo name={brand.name} />
          <p className="mt-5 text-sm leading-7 text-fg-muted"><Tr text={brand.tagline} /></p>
          {links.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {links.map((s) => {
                const Icon = SOCIAL_ICONS[s.id];
                return <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="grid h-11 w-11 place-items-center rounded-full border border-line/15 bg-glass text-fg transition hover:bg-accent hover:text-on-accent"><Icon className="h-5 w-5" /></a>;
              })}
            </div>
          )}
          <div className="mt-6 space-y-2 text-xs leading-6 text-fg-muted">
            <p className="font-black text-fg">{brand.legalName}</p>
            <p><Tr vi="Giấy CN ĐKKD số" en="Business reg. no." /> {legal.businessRegistration.number} — <Tr vi="cấp ngày" en="issued" /> {legal.businessRegistration.issuedDate}, {legal.businessRegistration.issuedBy}</p>
            {legal.licenses.map((l) => <p key={l}>{l}</p>)}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {legal.iso.map((iso) => <span key={iso} className="rounded-full border border-line/20 bg-glass px-3 py-1 text-[11px] font-black text-fg">{iso}</span>)}
          </div>
          <a href={telHref(complaintHotline)} className="mt-6 flex items-center gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-4 transition hover:bg-accent/20">
            <ExclamationCircleIcon className="h-6 w-6 shrink-0 text-accent-ink" />
            <span><span className="block text-xs font-bold text-fg-muted"><Tr vi="Hotline khiếu nại – góp ý" en="Complaints hotline" /></span><span className="text-lg font-black tabular-nums text-fg">{complaintHotline}</span></span>
          </a>
        </div>

        {/* Cửa hàng theo chi nhánh */}
        <div>
          <h2 className="t15-footer-title"><Tr vi="Hệ thống cửa hàng" en="Stores" /></h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            {branches.map((b) => (
              <div key={b.id}>
                <div className="flex items-center gap-1.5 text-sm font-black text-fg"><MapPinIcon className="h-4 w-4 text-primary" />{b.name}</div>
                <ul className="mt-2 space-y-3">
                  {[{ name: "Tổng đài chi nhánh", address: "", phone: b.hotline.main }, ...b.stores].map((s) => (
                    <li key={s.name + s.phone} className="text-xs leading-5 text-fg-muted">
                      <div className="font-bold text-fg">{s.name}</div>
                      {s.address && <div>{s.address}</div>}
                      <div className="mt-1 flex items-center gap-2">
                        <a href={telHref(s.phone)} className="font-black tabular-nums text-fg hover:text-accent-ink">{s.phone}</a>
                        <a href={zaloHref(s.phone)} target="_blank" rel="noopener noreferrer" aria-label={`Zalo ${s.phone}`} className="inline-flex min-h-8 items-center gap-1 rounded-full bg-primary/20 px-2.5 text-[11px] font-black text-fg hover:bg-primary hover:text-on-primary">
                          <ZaloIcon className="h-3.5 w-3.5" />Zalo
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Liên kết */}
        <div className="grid content-start gap-8 sm:grid-cols-3 lg:grid-cols-1">
          <div>
            <h2 className="t15-footer-title"><Tr vi="Giải pháp" en="Solutions" /></h2>
            <ul className="mt-5 space-y-3 text-sm text-fg-muted">
              {SEGMENT_ORDER.map((s) => <li key={s}><Link className="hover:text-fg" href={`/?phan-khuc=${SEGMENT_SLUGS[s]}#goi-giai-phap`}><Tr vi={SEGMENTS[s].label} en={SEGMENTS[s].en.label} /></Link></li>)}
              <li><Link className="hover:text-fg" href="/giai-phap"><Tr vi="Dịch vụ kỹ thuật" en="Engineering services" /></Link></li>
            </ul>
          </div>
          <div>
            <h2 className="t15-footer-title"><Tr vi="Công ty" en="Company" /></h2>
            <ul className="mt-5 space-y-3 text-sm text-fg-muted">
              <li><Link className="hover:text-fg" href="/ve-chung-toi"><Tr vi="Về chúng tôi" en="About us" /></Link></li>
              {catalogEnabled && <li><Link className="hover:text-fg" href="/san-pham"><Tr vi="Sản phẩm & thiết bị" en="Products" /></Link></li>}
              <li><Link className="hover:text-fg" href="/tin-tuc"><Tr vi="Tin tức & kinh nghiệm" en="News & guides" /></Link></li>
              <li><Link className="hover:text-fg" href="/cam-nang"><Tr vi="Cẩm nang" en="Guides" /></Link></li>
              <li><Link className="hover:text-fg" href="/lien-he"><Tr vi="Liên hệ" en="Contact" /></Link></li>
            </ul>
          </div>
          <div>
            <h2 className="t15-footer-title"><Tr vi="Chính sách" en="Policies" /></h2>
            <ul className="mt-5 space-y-3 text-sm text-fg-muted">
              {legal.policies.map((p) => <li key={p.slug}><Link className="hover:text-fg" href={`/chinh-sach/${p.slug}`}>{p.title}</Link></li>)}
            </ul>
            <p className="mt-5 text-xs text-fg-muted">{workingHours}<br />{brand.email}</p>
          </div>
          <MoitBadge />
        </div>
      </div>
      <div className="relative border-t border-line/12">
        <div className="t15-container flex flex-col gap-2 py-5 pb-28 text-xs text-fg-muted md:flex-row md:justify-between lg:pb-5">
          <span>© {new Date().getFullYear()} {brand.name}. <Tr vi="Website demo — dữ liệu hư cấu." en="Demo website — fictional data." /></span>
          <span><Tr vi="Tên, số liệu, địa chỉ, thương hiệu và giấy phép là mẫu, cần thay trước khi xuất bản." en="Names, figures, addresses, brands and licences are samples." /></span>
        </div>
      </div>
    </footer>
  );
}
