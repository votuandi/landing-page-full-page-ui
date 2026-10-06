/**
 * THÔNG TIN CÔNG TY — sửa file này để đổi thương hiệu.
 * Mọi tên, số điện thoại, Zalo, mạng xã hội, số liệu năng lực trên website đều đọc từ đây.
 * Để trống (chuỗi "") hoặc xóa một link → nút tương ứng tự ẩn, không render link rỗng.
 */

export type SiteMode = "installer" | "installer_distributor";

const envMode = process.env.NEXT_PUBLIC_SITE_MODE;

export const SITE_CONFIG = {
  brand: {
    name: "Minwy Solar",
    legalName: "CÔNG TY TNHH MINWY SOLAR [DỮ LIỆU MẪU]",
    tagline: "Giảm tiền điện cho gia đình, cửa hàng và nhà xưởng.",
    /** Ảnh logo (đường dẫn trong /public). Để "" để dùng logo chữ tự sinh theo màu template. */
    logo: "",
    /** Chữ viết tắt hiển thị trong biểu tượng logo tự sinh. */
    logoText: "MW",
    foundedYear: 2015,
  },

  /**
   * "installer"             : chỉ lắp đặt — không có trang /san-pham, menu không có "Sản phẩm".
   * "installer_distributor" : lắp đặt + phân phối thiết bị — bật trang /san-pham và dải logo hãng.
   * Có thể ghi đè bằng biến môi trường NEXT_PUBLIC_SITE_MODE.
   */
  siteMode: (envMode === "installer" || envMode === "installer_distributor" ? envMode : "installer_distributor") as SiteMode,

  /** Màu thanh trình duyệt trên mobile — nên trùng --bg trong globals.css */
  themeColor: "#0B1F1C",

  url: process.env.NEXT_PUBLIC_SITE_URL || "https://template-12.minwysoft.com",

  contact: {
    phone: "0901 234 567",
    phoneRaw: "0901234567",
    zalo: "https://zalo.me/0901234567",
    messenger: "https://m.me/minwysolar",
    email: "lienhe@minwysolar.example",
    address: "Khu công nghiệp Tân Tạo, TP. Hồ Chí Minh [DỮ LIỆU MẪU]",
    workingHours: "Thứ 2 – Thứ 7: 08:00 – 17:30",
    taxCode: "0312XXXXXX [DỮ LIỆU MẪU]",
    license: "Giấy phép/đăng ký ngành nghề: [CẦN XÁC MINH]",
  },

  /** Nút nào không có url sẽ không hiển thị. */
  socials: {
    tiktok: { url: "https://www.tiktok.com/@minwysolar", handle: "minwysolar" },
    youtube: { url: "https://www.youtube.com/@minwysolar", handle: "minwysolar" },
    facebook: { url: "https://www.facebook.com/minwysolar" },
  } as Socials,

  /** Số liệu nổi bật. "Năm kinh nghiệm" tự tính từ brand.foundedYear. */
  capabilities: { mwp: 38.6, customers: 1250, technicians: 36, projects: 286, provinces: 18 },

  // Tham số calculator cũ của template-8 (sẽ chuyển sang config/solar.ts)
  calculator: {
    electricityRates: { household: 3050, business: 3150, manufacturing: 2850 },
    systemCostPerKwp: { household: 15500000, business: 13700000, manufacturing: 12800000 },
    sunHours: { north: 3.4, central: 4.2, south: 4.7 },
    degradationPerYear: 0.005, annualElectricityInflation: 0.03, years: 25,
  },

  demo: {
    enabled: process.env.NEXT_PUBLIC_DEMO_MODE !== "false",
    templateCtaUrl: process.env.NEXT_PUBLIC_TEMPLATE_CTA_URL || "/lien-he",
    pricingUrl: process.env.NEXT_PUBLIC_PRICING_URL || "/lien-he",
  },
  legal: {
    ministryNoticeLogo: "[PLACEHOLDER LOGO THÔNG BÁO BỘ CÔNG THƯƠNG]",
  },
};

export type Socials = {
  tiktok?: { url: string; handle: string };
  youtube?: { url: string; handle: string };
  facebook?: { url: string };
};

export const isDistributor = SITE_CONFIG.siteMode === "installer_distributor";

/** Số năm kinh nghiệm luôn tính theo năm hiện tại. */
export const yearsOfExperience = () => new Date().getFullYear() - SITE_CONFIG.brand.foundedYear;

/** Menu chính — tối đa 6 mục. "Sản phẩm" chỉ có ở chế độ installer_distributor. */
export const NAV_ITEMS: { label: string; href: string }[] = [
  { label: "Dự toán chi phí", href: "/#du-toan" },
  { label: "Gói giải pháp", href: "/#goi-giai-phap" },
  { label: "Công trình", href: "/#cong-trinh" },
  ...(isDistributor ? [{ label: "Sản phẩm", href: "/san-pham" }] : []),
  { label: "Về chúng tôi", href: "/ve-chung-toi" },
  { label: "Liên hệ", href: "/lien-he" },
].slice(0, 6);

/**
 * Bộ màu thử nhanh trong thanh demo. Giá trị là kênh "R G B" ghi đè token --c-primary / --c-accent.
 * Muốn đổi màu cố định cho khách: sửa :root trong src/app/globals.css.
 */
export const THEME_PRESETS = {
  emerald: { label: "Emerald Dusk", primary: "16 185 129", accent: "245 184 61" },
  teal: { label: "Ngọc lam", primary: "45 212 191", accent: "251 191 36" },
  lime: { label: "Lá non", primary: "132 204 22", accent: "250 204 21" },
  sky: { label: "Trời xanh", primary: "56 189 248", accent: "245 184 61" },
} as const;
