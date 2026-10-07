/**
 * Lớp dẫn xuất từ src/config/site.config.ts — KHÔNG chứa dữ liệu công ty.
 * Muốn đổi tên, hotline, địa chỉ… hãy sửa site.config.ts.
 */

import { siteConfig, type Branch, type GeoPoint } from "@/config/site.config";

export { siteConfig };
export type SiteMode = "installer" | "installer_distributor";

const envMode = process.env.NEXT_PUBLIC_SITE_MODE;
const siteMode: SiteMode = envMode === "installer" || envMode === "installer_distributor" ? envMode : siteConfig.siteMode;

/* ---------- Số điện thoại, Zalo, bản đồ ---------- */

export const phoneDigits = (phone: string) => phone.replace(/\D/g, "");
export const telHref = (phone: string) => `tel:${phoneDigits(phone)}`;
export const zaloHref = (phone: string) => `https://zalo.me/${phoneDigits(phone)}`;
export const mapsUrl = (p: GeoPoint) => `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;
export const directionsUrl = (p: GeoPoint) => `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;

export const primaryBranch: Branch = siteConfig.branches.find((b) => b.primary) || siteConfig.branches[0];
const viText = (t: string | { vi: string }) => (typeof t === "string" ? t : t.vi);

/** Cấu trúc tương thích template-12 — các trang phụ (liên hệ, về chúng tôi…) vẫn đọc từ đây. */
export const SITE_CONFIG = {
  brand: {
    name: siteConfig.brand.name,
    legalName: siteConfig.brand.legalName,
    tagline: viText(siteConfig.brand.tagline),
    logo: siteConfig.brand.logo,
    logoText: siteConfig.brand.logoText,
    foundedYear: siteConfig.brand.foundedYear,
  },
  siteMode,
  themeColor: siteConfig.brand.themeColor,
  url: siteConfig.brand.url,
  contact: {
    phone: primaryBranch.hotline.main,
    phoneRaw: phoneDigits(primaryBranch.hotline.main),
    zalo: zaloHref(siteConfig.zalo.household.phone),
    messenger: siteConfig.messenger,
    email: siteConfig.brand.email,
    address: primaryBranch.office.address,
    workingHours: siteConfig.workingHours,
    taxCode: siteConfig.legal.businessRegistration.number,
    license: siteConfig.legal.licenses[0] || "",
  },
  socials: Object.fromEntries(siteConfig.socials.filter((s) => s.id !== "zalo").map((s) => [s.id, { url: s.url, handle: s.handle.replace(/^@/, "") }])) as Socials,
  capabilities: {
    mwp: siteConfig.stats.mwp,
    customers: siteConfig.stats.customers,
    technicians: siteConfig.stats.engineers,
    projects: siteConfig.stats.projects,
    provinces: siteConfig.stats.provinces,
  },
  demo: siteConfig.demo,
  legal: { ministryNoticeLogo: "" },
};

export type Socials = {
  tiktok?: { url: string; handle: string };
  youtube?: { url: string; handle: string };
  facebook?: { url: string; handle?: string };
};

export const isDistributor = siteMode === "installer_distributor";

/** Số năm kinh nghiệm luôn tính theo năm hiện tại. */
export const yearsOfExperience = () => new Date().getFullYear() - siteConfig.brand.foundedYear;

/** Link điều hướng phẳng (menu di động, trang phụ). Mega menu đọc trực tiếp từ site.config.ts. */
export const NAV_ITEMS: { label: string; href: string }[] = [
  { label: "Dự toán chi phí", href: "/#du-toan" },
  { label: "Dự án", href: "/#du-an" },
  ...(isDistributor ? [{ label: "Thiết bị", href: "/san-pham" }] : []),
  { label: "Đại lý", href: "/#dai-ly" },
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
