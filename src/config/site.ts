/**
 * THÔNG TIN CÔNG TY — sửa file này để đổi thương hiệu.
 * Mọi tên, hotline, Zalo, mạng xã hội, số liệu năng lực trên website đều đọc từ đây.
 * Để trống (chuỗi "") một link → nút tương ứng tự ẩn, không render link rỗng.
 */

export type Hotline = { label: string; phone: string };
export type Socials = {
  tiktok?: { url: string; handle: string };
  youtube?: { url: string; handle: string };
  facebook?: { url: string };
};

export const SITE_CONFIG = {
  brand: {
    name: "Minwy Solar",
    legalName: "CÔNG TY TNHH MINWY SOLAR [DỮ LIỆU MẪU]",
    tagline: "Lắp đặt điện mặt trời & thiết bị năng lượng mặt trời chính hãng.",
    /** Ảnh logo trong /public. Để "" → logo vẽ sẵn theo màu template + tên công ty. */
    logo: "",
    /** Chữ viết tắt trên avatar kênh video (thẻ "Xem thêm"). */
    logoText: "MW",
    /** "Số năm kinh nghiệm" tự tính theo năm hiện tại. */
    foundedYear: 2014,
  },

  /** Màu thanh trình duyệt trên mobile — nên trùng --bg trong globals.css */
  themeColor: "#FBF7F1",

  url: process.env.NEXT_PUBLIC_SITE_URL || "https://template-13.minwysoft.com",

  /**
   * Hotline theo mục đích — hiện ở topbar (desktop) và footer.
   * Số ĐẦU TIÊN được dùng cho nút "Gọi" trên thanh liên hệ mobile.
   */
  hotlines: [
    { label: "Tư vấn lắp đặt", phone: "0901 234 567" },
    { label: "Dự án doanh nghiệp", phone: "0902 345 678" },
    { label: "Bảo hành", phone: "1900 6868" },
  ] as Hotline[],

  contact: {
    zalo: "https://zalo.me/0901234567",
    messenger: "https://m.me/minwysolar",
    email: "lienhe@minwysolar.example",
    address: "Khu công nghiệp Tân Tạo, TP. Hồ Chí Minh [DỮ LIỆU MẪU]",
    workingHours: "Thứ 2 – Thứ 7: 7:30 – 18:00",
    taxCode: "0312XXXXXX [DỮ LIỆU MẪU]",
    license: "Giấy phép/đăng ký ngành nghề: [CẦN XÁC MINH]",
  },

  /** Nút mạng xã hội ở section video & footer. Kênh nào không có url sẽ không hiển thị. */
  socials: {
    tiktok: { url: "https://www.tiktok.com/@minwysolar", handle: "minwysolar" },
    youtube: { url: "https://www.youtube.com/@minwysolar", handle: "minwysolar" },
    facebook: { url: "https://www.facebook.com/minwysolar" },
  } as Socials,

  /** 3 con số nổi bật ở hero. "Năm kinh nghiệm" tự tính từ brand.foundedYear. */
  capabilities: { mwp: 42.5, customers: 3200 },

  /** Catalog sản phẩm + giỏ yêu cầu báo giá. false → ẩn trang /san-pham, dải sản phẩm và giỏ. */
  catalog: { enabled: process.env.NEXT_PUBLIC_CATALOG_ENABLED !== "false" },

  /** Sau khi gửi yêu cầu: "Chúng tôi sẽ gọi lại trong X giờ". */
  callbackHours: 2,

  /** Link đánh giá bên ngoài ở khối uy tín. Để "" để ẩn. */
  reviews: {
    google: { url: "https://www.google.com/maps", rating: 4.9, count: 312 },
    trustpilot: { url: "", rating: 0, count: 0 },
  },

  /** Dải cam kết dịch vụ ngay trước footer (đúng 4 mục hiển thị đẹp nhất). */
  commitments: [
    { title: "Khảo sát miễn phí", desc: "Kỹ sư đến tận nơi đo mái, đọc hóa đơn" },
    { title: "Bảo hành dài hạn", desc: "Tấm pin tới 25 năm hiệu suất, thi công 5 năm" },
    { title: "Hỗ trợ thủ tục đấu nối EVN", desc: "Chuẩn bị hồ sơ, làm việc với điện lực" },
    { title: "Bảo trì & vệ sinh định kỳ", desc: "Kiểm tra, vệ sinh tấm pin theo lịch" },
  ],

  /** Popup "Tư vấn sản phẩm": hiện sau delayMs hoặc khi cuộn qua scrollRatio trang, tối đa 1 lần/phiên. */
  popup: { enabled: true, delayMs: 30_000, scrollRatio: 0.6 },

  demo: {
    enabled: process.env.NEXT_PUBLIC_DEMO_MODE !== "false",
    templateCtaUrl: process.env.NEXT_PUBLIC_TEMPLATE_CTA_URL || "/lien-he",
    pricingUrl: process.env.NEXT_PUBLIC_PRICING_URL || "/lien-he",
  },
  legal: {
    ministryNoticeLogo: "[PLACEHOLDER LOGO THÔNG BÁO BỘ CÔNG THƯƠNG]",
  },
};

/** Số năm kinh nghiệm luôn tính theo năm hiện tại. */
export const yearsOfExperience = () => new Date().getFullYear() - SITE_CONFIG.brand.foundedYear;

/** "0901 234 567" → "tel:0901234567" */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

/** Hotline đầu tiên có số — dùng cho nút "Gọi" và schema SEO. */
export const primaryHotline = SITE_CONFIG.hotlines.find((h) => h.phone.trim());

export const catalogEnabled = SITE_CONFIG.catalog.enabled;

/** Menu chính — tối đa 6 mục, không mega-menu. "Sản phẩm" chỉ có khi bật catalog. */
export const NAV_ITEMS: { label: string; href: string }[] = [
  { label: "Giải pháp", href: "/#goi-giai-phap" },
  { label: "Dự toán", href: "/#du-toan" },
  { label: "Công trình", href: "/#cong-trinh" },
  ...(catalogEnabled ? [{ label: "Sản phẩm", href: "/san-pham" }] : []),
  { label: "Tin tức", href: "/tin-tuc" },
  { label: "Liên hệ", href: "/lien-he" },
].slice(0, 6);

/**
 * Bộ màu thử nhanh trong bảng demo. Giá trị là kênh "R G B" ghi đè token --c-primary / --c-accent.
 * Muốn đổi màu cố định cho khách: sửa :root trong src/app/globals.css.
 */
export const THEME_PRESETS = {
  sand: { label: "Warm Sand", primary: "194 65 12", accent: "15 118 110" },
  brick: { label: "Gạch nung", primary: "185 28 28", accent: "21 94 117" },
  amber: { label: "Hổ phách", primary: "180 83 9", accent: "22 101 52" },
  plum: { label: "Mận chín", primary: "134 25 143", accent: "15 118 110" },
} as const;
