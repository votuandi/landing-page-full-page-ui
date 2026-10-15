/** Slug tenant = subdomain nền tảng (D17, D21): nhãn DNS chữ thường, 3–63 ký tự, không `--` (tránh `xn--`). */
export const RESERVED_TENANT_SLUGS = Object.freeze([
  "admin", "console", "preview", "www", "api", "media", "sites", "app", "mail", "static", "status",
] as const);

const TENANT_SLUG = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/;

export function isTenantSlug(slug: string) {
  return TENANT_SLUG.test(slug) && !slug.includes("--") && !(RESERVED_TENANT_SLUGS as readonly string[]).includes(slug);
}

export function assertTenantSlug(slug: string) {
  if (!isTenantSlug(slug)) throw new Error(`Subdomain không hợp lệ hoặc đã được dành riêng: ${slug}`);
  return slug;
}

/** Tài khoản owner tự tạo khi dựng site: `nang-luong-solar` → `nangluongsolar_admin` (D21 §5). */
export function adminUsernameFor(slug: string) {
  return `${assertTenantSlug(slug).replace(/-/g, "")}_admin`;
}
