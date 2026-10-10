/** [DỮ LIỆU MẪU] Footer t15: tên công ty, giấy phép, địa chỉ, số điện thoại là hư cấu. */
import type { z } from "zod";
import type { siteFooterSchema } from "./schema";

const page = (value: string, vi: string, en: string) => ({ kind: "page" as const, value, label: { vi, en } });

export const siteFooterFixture = {
  brand: { name: "Lumivolt Energy", tagline: { vi: "Nhà phân phối thiết bị & tổng thầu EPC điện mặt trời.", en: "Solar equipment distributor & EPC contractor." } },
  socials: [
    { kind: "facebook", url: "https://www.facebook.com/lumivolt.demo", label: "Facebook" },
    { kind: "youtube", url: "https://www.youtube.com/@lumivolt.demo", label: "YouTube" },
    { kind: "tiktok", url: "https://www.tiktok.com/@lumivolt.demo", label: "TikTok" },
    { kind: "zalo", url: "https://zalo.me/0901234500", label: "Zalo OA" },
  ],
  legal: {
    legalName: "CÔNG TY CỔ PHẦN NĂNG LƯỢNG LUMIVOLT [DỮ LIỆU MẪU]",
    lines: [
      { vi: "Giấy CN ĐKKD số 03XXXXXXXX [MẪU] — cấp ngày 15/03/2012, Sở Kế hoạch và Đầu tư (mẫu)", en: "Business reg. no. 03XXXXXXXX [SAMPLE] — issued 15/03/2012" },
      { vi: "Chứng chỉ năng lực hoạt động xây dựng hạng II — số MẪU-0001 [HƯ CẤU]" },
      { vi: "Giấy phép hoạt động điện lực (tư vấn thiết kế) — số MẪU-0002 [HƯ CẤU]" },
    ],
    badges: ["ISO 9001:2015", "ISO 14001:2015", "ISO 45001:2018"],
    moitBadge: { enabled: true },
  },
  complaintHotline: { label: { vi: "Hotline khiếu nại – góp ý", en: "Complaints hotline" }, phone: "0901 234 599" },
  branchesTitle: { vi: "Hệ thống cửa hàng", en: "Stores" },
  branches: [
    { name: "TP. Hồ Chí Minh", stores: [
      { name: "Tổng đài chi nhánh", phone: "0901 234 500" },
      { name: "Showroom Quận Mẫu", address: "120 Đường Mẫu A, TP. Hồ Chí Minh [HƯ CẤU]", phone: "0901 234 511" },
      { name: "Cửa hàng Mẫu Thủ Đức", address: "45 Đường Mẫu B, TP. Hồ Chí Minh [HƯ CẤU]", phone: "0901 234 512" },
    ] },
    { name: "Hà Nội", stores: [
      { name: "Tổng đài chi nhánh", phone: "0901 234 520" },
      { name: "Showroom Mẫu Cầu Giấy", address: "18 Phố Mẫu C, Hà Nội [HƯ CẤU]", phone: "0901 234 531" },
    ] },
    { name: "Đà Nẵng", stores: [
      { name: "Tổng đài chi nhánh", phone: "0901 234 540" },
      { name: "Cửa hàng Mẫu Hải Châu", address: "9 Đường Mẫu E, Đà Nẵng [HƯ CẤU]", phone: "0901 234 551" },
    ] },
    { name: "Cần Thơ", stores: [
      { name: "Tổng đài chi nhánh", phone: "0901 234 580" },
      { name: "Showroom Mẫu Ninh Kiều", address: "15 Đường Mẫu I, Cần Thơ [HƯ CẤU]", phone: "0901 234 591" },
    ] },
  ],
  columns: [
    { title: { vi: "Giải pháp", en: "Solutions" }, links: [
      page("?phan-khuc=ho-gia-dinh", "Hộ gia đình", "Households"),
      page("?phan-khuc=cua-hang", "Cửa hàng & chuỗi", "Shops & chains"),
      page("?phan-khuc=nha-xuong", "Nhà xưởng", "Factories"),
      page("?phan-khuc=trang-trai", "Trang trại", "Farms"),
      page("giai-phap", "Dịch vụ kỹ thuật", "Engineering services"),
    ] },
    { title: { vi: "Công ty", en: "Company" }, links: [
      page("ve-chung-toi", "Về chúng tôi", "About us"),
      page("san-pham", "Sản phẩm & thiết bị", "Products"),
      page("tin-tuc", "Tin tức & kinh nghiệm", "News & guides"),
      page("cam-nang", "Cẩm nang", "Guides"),
      page("lien-he", "Liên hệ", "Contact"),
    ] },
    { title: { vi: "Chính sách", en: "Policies" }, links: [
      page("chinh-sach/bao-hanh", "Chính sách bảo hành", "Warranty policy"),
      page("chinh-sach/doi-tra", "Chính sách đổi trả", "Returns policy"),
      page("chinh-sach/van-chuyen", "Chính sách vận chuyển", "Shipping policy"),
      page("chinh-sach/bao-mat", "Chính sách bảo mật", "Privacy policy"),
    ] },
  ],
  contactNote: { vi: "Thứ 2 – Thứ 7: 08:00 – 17:30\nlienhe@lumivolt.example", en: "Mon – Sat: 08:00 – 17:30\nlienhe@lumivolt.example" },
  disclaimer: [
    { vi: "Website demo — dữ liệu hư cấu.", en: "Demo website — fictional data." },
    { vi: "Tên, số liệu, địa chỉ, thương hiệu và giấy phép là mẫu, cần thay trước khi xuất bản.", en: "Names, figures, addresses, brands and licences are samples." },
  ],
} satisfies z.input<typeof siteFooterSchema>;
