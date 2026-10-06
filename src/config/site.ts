import { getBrand } from "@/content/solar";
const brand=getBrand();
export const SITE_CONFIG = {
  brand: { name: brand.name, legalName: `${brand.name} [DỮ LIỆU MẪU]`, tagline: brand.slogan, logoText: "MW" },
  url: process.env.NEXT_PUBLIC_SITE_URL || brand.url,
  contact: {
    phone: brand.hotlines[0].phone, phoneRaw: brand.hotlines[0].phone, zalo: brand.zalo.home,
    email: brand.email, address: brand.address,
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
  solar: { label: "Xanh nắng", primary: "var(--solar-primary-dark)", accent: "var(--solar-accent)" },
  navy: { label: "Navy kỹ thuật", primary: "var(--solar-primary-dark)", accent: "var(--solar-accent)" },
  graphite: { label: "Than chì", primary: "var(--solar-primary-dark)", accent: "var(--solar-accent)" },
  forest: { label: "Xanh rừng", primary: "var(--solar-primary-dark)", accent: "var(--solar-accent)" },
  royal: { label: "Xanh hoàng gia", primary: "var(--solar-primary-dark)", accent: "var(--solar-accent)" }
} as const;