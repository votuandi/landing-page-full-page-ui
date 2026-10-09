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

/** Hotline chính — dùng cho nút "Gọi", lỗi gửi form và schema SEO. */
export const primaryHotline = { label: "Tổng đài", phone: primaryBranch.hotline.main };

/** Cấu trúc gọn cho các trang phụ (liên hệ, về chúng tôi…) — đọc từ site.config.ts. */
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
  callbackHours: siteConfig.callbackHours,
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
};

export type Socials = {
  tiktok?: { url: string; handle: string };
  youtube?: { url: string; handle: string };
  facebook?: { url: string; handle?: string };
};

export const isDistributor = siteMode === "installer_distributor";
/** Catalog + giỏ yêu cầu báo giá: cần chế độ nhà phân phối VÀ catalog.enabled. */
export const catalogEnabled = isDistributor && siteConfig.catalog.enabled;

/** Số năm kinh nghiệm luôn tính theo năm hiện tại. */
export const yearsOfExperience = () => new Date().getFullYear() - siteConfig.brand.foundedYear;

/**
 * Bộ màu thử nhanh trong thanh demo. Giá trị là kênh "R G B" ghi đè token --c-primary / --c-secondary / --c-accent.
 * Muốn đổi màu cố định cho khách: sửa :root trong src/app/globals.css.
 */
export const THEME_PRESETS = {
  fresh: { label: "Fresh Energy", primary: "21 128 61", secondary: "3 105 161", accent: "250 204 21" },
  forest: { label: "Rừng xanh", primary: "22 101 52", secondary: "15 118 110", accent: "234 179 8" },
  ocean: { label: "Biển xanh", primary: "15 118 110", secondary: "29 78 216", accent: "250 204 21" },
  lime: { label: "Lá non", primary: "77 124 15", secondary: "2 132 199", accent: "253 224 71" },
} as const;
