import type { Permission } from "@solar/auth";
import type { Feature } from "@solar/plans";
import type { AdminNavGroup } from "@solar/ui";

type NavEntry = { href: string; label: string; permission: Permission; feature?: Feature };
export const ADMIN_NAV: { label?: string; items: NavEntry[] }[] = [
  { items: [
    { href: "/", label: "Tổng quan", permission: "dashboard.view" },
    { href: "/trang", label: "Trang & Section", permission: "pages.view" },
    { href: "/noi-dung", label: "Nội dung", permission: "content.edit" },
    { href: "/media", label: "Media", permission: "media.view" },
    { href: "/lead", label: "Lead", permission: "leads.view", feature: "leadInbox" },
    { href: "/giao-dien", label: "Giao diện", permission: "theme.manage" },
    { href: "/cai-dat", label: "Thông tin công ty", permission: "settings.manage" },
    { href: "/cai-dat/kenh-nhan-lead", label: "Kênh nhận lead", permission: "settings.manage" },
    { href: "/ten-mien", label: "Tên miền", permission: "domains.manage", feature: "customDomain" },
    { href: "/email", label: "Email theo tên miền", permission: "email.manage", feature: "customDomain" },
    { href: "/nhan-vien", label: "Tài khoản & nhân viên", permission: "users.view" },
    { href: "/goi", label: "Gói", permission: "billing.view" },
  ] },
  { label: "Tài khoản của tôi", items: [
    { href: "/doi-mat-khau", label: "Đổi mật khẩu", permission: "account.password" },
    { href: "/tai-khoan/bao-mat", label: "Bảo mật", permission: "account.totp" },
  ] },
];

export function adminNav({ permissions, can, pathname }: {
  permissions: ReadonlySet<Permission>;
  can: (feature: string) => boolean;
  pathname?: string | null;
}): AdminNavGroup[] {
  const visible = (item: NavEntry) => permissions.has(item.permission) && (!item.feature || can(item.feature));
  const active = ADMIN_NAV.flatMap(group => group.items).filter(visible)
    .filter(item => pathname === item.href || (item.href !== "/" && pathname?.startsWith(`${item.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return ADMIN_NAV.map(group => ({
    label: group.label,
    items: group.items.filter(visible).map(({ href, label }) => ({ href, label, current: href === active })),
  })).filter(group => group.items.length > 0);
}
