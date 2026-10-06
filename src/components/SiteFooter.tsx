import Link from "next/link";
import { PhoneIcon } from "@heroicons/react/24/outline";
import { SITE_CONFIG, catalogEnabled, telHref } from "@/config/site";
import { FacebookIcon, TikTokIcon, YouTubeIcon } from "@/components/BrandIcons";
import BrandLogo from "@/components/BrandLogo";
import CommitmentsStrip from "@/components/CommitmentsStrip";

const SOCIALS = [
  SITE_CONFIG.socials.tiktok?.url && { label: "TikTok", href: SITE_CONFIG.socials.tiktok.url, Icon: TikTokIcon },
  SITE_CONFIG.socials.youtube?.url && { label: "YouTube", href: SITE_CONFIG.socials.youtube.url, Icon: YouTubeIcon },
  SITE_CONFIG.socials.facebook?.url && { label: "Facebook", href: SITE_CONFIG.socials.facebook.url, Icon: FacebookIcon },
].filter(Boolean) as { label: string; href: string; Icon: typeof TikTokIcon }[];

export default function SiteFooter() {
  const { contact, brand, hotlines } = SITE_CONFIG;
  return (
    <>
    <CommitmentsStrip />
    <footer className="t13-invert bg-gradient-to-br from-bg-deep to-primary-deep pb-24 lg:pb-0">
      <div className="t5-container grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-[1.2fr_.8fr_.8fr_1.2fr]">
        <div>
          <BrandLogo />
          <p className="mt-5 text-sm leading-7 text-fg-muted">{brand.tagline}</p>
          <p className="mt-5 text-xs leading-6 text-fg-subtle">{brand.legalName}<br />MST: {contact.taxCode}<br />{contact.license}</p>
          {SOCIALS.length > 0 && (
            <div className="mt-5 flex gap-2">
              {SOCIALS.map(({ label, href, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid h-11 w-11 place-items-center rounded-full border border-line/15 bg-glass text-fg transition hover:bg-on-media/20"><Icon className="h-5 w-5" /></a>
              ))}
            </div>
          )}
        </div>
        <div>
          <h2 className="t5-footer-title">Giải pháp</h2>
          <ul className="mt-5 space-y-3 text-sm text-fg-muted">
            <li><Link className="hover:text-fg" href="/?phan-khuc=ho-gia-dinh#goi-giai-phap">Hộ gia đình</Link></li>
            <li><Link className="hover:text-fg" href="/?phan-khuc=cua-hang#goi-giai-phap">Cửa hàng & chuỗi</Link></li>
            <li><Link className="hover:text-fg" href="/?phan-khuc=nha-xuong#goi-giai-phap">Nhà xưởng</Link></li>
            <li><Link className="hover:text-fg" href="/?phan-khuc=trang-trai#goi-giai-phap">Trang trại</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="t5-footer-title">Công ty</h2>
          <ul className="mt-5 space-y-3 text-sm text-fg-muted">
            <li><Link className="hover:text-fg" href="/ve-chung-toi">Về chúng tôi</Link></li>
            {catalogEnabled && <li><Link className="hover:text-fg" href="/san-pham">Sản phẩm</Link></li>}
            <li><Link className="hover:text-fg" href="/tin-tuc">Tin tức</Link></li>
            <li><Link className="hover:text-fg" href="/lien-he">Liên hệ</Link></li>
            <li className="text-xs text-fg-subtle">{SITE_CONFIG.legal.ministryNoticeLogo}</li>
          </ul>
        </div>
        <div>
          <h2 className="t5-footer-title">Hotline</h2>
          <ul className="mt-5 space-y-3">
            {hotlines.filter((h) => h.phone).map((h) => (
              <li key={h.label}>
                <a href={telHref(h.phone)} className="group flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-glass text-highlight"><PhoneIcon className="h-4 w-4" /></span>
                  <span><span className="block text-xs text-fg-subtle">{h.label}</span><span className="text-lg font-black text-fg group-hover:text-highlight">{h.phone}</span></span>
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-5 space-y-2 text-sm text-fg-muted">
            {contact.email && <a className="block hover:text-fg" href={`mailto:${contact.email}`}>{contact.email}</a>}
            <p>{contact.address}</p>
            <p>{contact.workingHours}</p>
          </div>
        </div>
      </div>
      <div className="border-t border-line/10">
        <div className="t5-container flex flex-col gap-2 py-5 text-xs text-fg-subtle md:flex-row md:justify-between">
          <span>© {new Date().getFullYear()} {brand.name}. Website demo.</span>
          <span>Thông tin pháp lý và thương hiệu mẫu cần thay trước khi xuất bản.</span>
        </div>
      </div>
    </footer>
    </>
  );
}
