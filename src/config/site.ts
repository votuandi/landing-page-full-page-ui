export const SITE_CONFIG = {
  brand: { name: "Minwy Solar", legalName: "CÔNG TY TNHH MINWY SOLAR [DỮ LIỆU MẪU]", tagline: "Giảm chi phí điện. Tăng hiệu quả vận hành.", logoText: "MW" },
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://template-5.minwysoft.com",
  contact: {
    phone: "0901 234 567", phoneRaw: "0901234567", zalo: "https://zalo.me/0901234567",
    email: "duan@minwysolar.example", address: "Khu công nghiệp Tân Tạo, TP. Hồ Chí Minh [DỮ LIỆU MẪU]",
    taxCode: "0312XXXXXX [DỮ LIỆU MẪU]", license: "Giấy phép/đăng ký ngành nghề: [CẦN XÁC MINH]",
    facebook: "https://facebook.com/", linkedin: "https://linkedin.com/"
  },
  capabilities: { years: 11, projects: 286, mwp: 38.6, engineers: 24, provinces: 18 },
  calculator: {
    electricityRates: { household: 3050, business: 3150, manufacturing: 2850 },
    systemCostPerKwp: { household: 15500000, business: 13700000, manufacturing: 12800000 },
    sunHours: { north: 3.4, central: 4.2, south: 4.7 },
    defaultSelfUse: { household: 0.72, business: 0.86, manufacturing: 0.92 },
    degradationPerYear: 0.005, annualElectricityInflation: 0.03, years: 25
  },
  demo: {
    enabled: process.env.NEXT_PUBLIC_DEMO_MODE !== "false",
    templateCtaUrl: process.env.NEXT_PUBLIC_TEMPLATE_CTA_URL || "/contact-us",
    pricingUrl: process.env.NEXT_PUBLIC_PRICING_URL || "/contact-us"
  },
  legal: {
    ministryNoticeLogo: "[PLACEHOLDER LOGO THÔNG BÁO BỘ CÔNG THƯƠNG]",
    privacyHref: "#", termsHref: "#"
  }
} as const;

export const NAV_ITEMS = [
  { label: "Trang chủ", href: "/" }, { label: "Giải pháp", href: "/service" },
  { label: "Thiết bị", href: "/product" }, { label: "Dự án", href: "/project/nha-may-thuc-pham-long-an" },
  { label: "Về chúng tôi", href: "/about-us" }, { label: "Liên hệ", href: "/contact-us" }
] as const;

export const THEME_PRESETS = {
  solar: { label: "Xanh nắng", primary: "#0d3b78", accent: "#f7b928" },
  navy: { label: "Navy kỹ thuật", primary: "#071b33", accent: "#f5b927" },
  graphite: { label: "Than chì", primary: "#17202b", accent: "#ffb703" },
  forest: { label: "Xanh rừng", primary: "#12372a", accent: "#f4c95d" },
  royal: { label: "Xanh hoàng gia", primary: "#172554", accent: "#facc15" }
} as const;