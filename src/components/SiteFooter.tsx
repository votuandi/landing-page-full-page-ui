import Link from "next/link";
import { SITE_CONFIG, isDistributor } from "@/config/site";
import BrandLogo from "@/components/BrandLogo";

/** Footer render phía server (không cần hydrate). */
export default function SiteFooter() {
  return (
    <footer className="t12-invert bg-gradient-to-br from-bg-deep to-primary-deep text-fg">
      <div className="t5-container grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <BrandLogo name={SITE_CONFIG.brand.name} />
          <p className="mt-5 text-sm leading-7 text-fg-muted">{SITE_CONFIG.brand.tagline}</p>
          <p className="mt-5 text-xs leading-6 text-fg-muted">{SITE_CONFIG.brand.legalName}<br />MST: {SITE_CONFIG.contact.taxCode}<br />{SITE_CONFIG.contact.license}</p>
        </div>
        <div>
          <h2 className="t5-footer-title">Giải pháp</h2>
          <div className="mt-5 space-y-3 text-sm text-fg-muted">
            <Link className="block hover:text-fg" href="/giai-phap/solar-gia-dinh">Solar hộ gia đình</Link>
            <Link className="block hover:text-fg" href="/giai-phap/hybrid-luu-tru">Solar cửa hàng & hybrid</Link>
            <Link className="block hover:text-fg" href="/giai-phap/solar-nha-xuong">Solar nhà xưởng, trang trại</Link>
            <Link className="block hover:text-fg" href="/giai-phap/om-ve-sinh">Bảo trì & vệ sinh</Link>
          </div>
        </div>
        <div>
          <h2 className="t5-footer-title">Công ty</h2>
          <div className="mt-5 space-y-3 text-sm text-fg-muted">
            <Link className="block hover:text-fg" href="/ve-chung-toi">Về chúng tôi</Link>
            {isDistributor && <Link className="block hover:text-fg" href="/san-pham">Sản phẩm</Link>}
            <Link className="block hover:text-fg" href="/lien-he">Liên hệ</Link>
            <span className="block">{SITE_CONFIG.legal.ministryNoticeLogo}</span>
          </div>
        </div>
        <div>
          <h2 className="t5-footer-title">Liên hệ</h2>
          <div className="mt-5 space-y-3 text-sm text-fg-muted">
            {SITE_CONFIG.contact.phoneRaw && <a className="block text-lg font-black text-fg" href={`tel:${SITE_CONFIG.contact.phoneRaw}`}>{SITE_CONFIG.contact.phone}</a>}
            {SITE_CONFIG.contact.email && <a className="block hover:text-fg" href={`mailto:${SITE_CONFIG.contact.email}`}>{SITE_CONFIG.contact.email}</a>}
            <p>{SITE_CONFIG.contact.address}</p>
            <p>{SITE_CONFIG.contact.workingHours}</p>
          </div>
        </div>
      </div>
      <div className="border-t border-line/12"><div className="t5-container flex flex-col gap-2 py-5 pb-24 text-xs text-fg-muted md:flex-row md:justify-between lg:pb-5"><span>© {new Date().getFullYear()} {SITE_CONFIG.brand.name}. Website demo.</span><span>Thông tin pháp lý và thương hiệu mẫu cần thay trước khi xuất bản.</span></div></div>
    </footer>
  );
}
