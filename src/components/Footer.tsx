import Link from "next/link";
import Brand from "@/components/template/Brand";
import { NAVIGATION_ITEMS, SITE_CONFIG } from "@/utils/constants";
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <Link href="/">
            <Brand />
          </Link>
          <p>
            Đồng hành cùng bạn xây dựng hệ thống điện mặt trời phù hợp, hiệu quả
            và bền vững.
          </p>
        </div>
        <div>
          <h2>Khám phá Minwy</h2>
          <nav aria-label="Điều hướng cuối trang">
            {NAVIGATION_ITEMS.slice(1).map((item) => (
              <Link href={item.href} key={item.href}>
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div>
          <h2>Kết nối với chúng tôi</h2>
          <a className="footer-phone" href={`tel:${SITE_CONFIG.phone}`}>
            {SITE_CONFIG.phoneDisplay}
          </a>
          <a href={`mailto:${SITE_CONFIG.email}`}>{SITE_CONFIG.email}</a>
          <p>{SITE_CONFIG.address}</p>
          <p>{SITE_CONFIG.workingHours}</p>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>
          © {new Date().getFullYear()} {SITE_CONFIG.name}. Tất cả quyền được bảo
          lưu.
        </span>
        <span>Hướng đến một tương lai xanh.</span>
      </div>
    </footer>
  );
}
