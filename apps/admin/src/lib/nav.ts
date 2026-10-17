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
  return ADMIN_NAV.map(group => ({
    label: group.label,
    items: group.items.filter(item => permissions.has(item.permission) && (!item.feature || can(item.feature)))
      .map(({ href, label }) => ({ href, label, current: pathname === href || (href !== "/" && Boolean(pathname?.startsWith(`${href}/`))) })),
  })).filter(group => group.items.length > 0);
}
