import { z } from "zod";

export const PERMISSIONS = [
  "dashboard.view", "pages.view", "pages.edit", "pages.publish", "pages.structure", "content.edit",
  "media.view", "media.manage", "leads.view", "leads.manage", "theme.manage", "domains.manage", "email.manage",
  "billing.view", "users.view", "users.manage", "settings.manage", "audit.view", "clients.view", "clients.manage",
  "bookings.view", "bookings.manage", "account.password", "account.totp", "users.resetPassword",
  "users.transferOwner", "users.delete", "site.backup", "storefront.account", "storefront.cart", "storefront.booking",
] as const;
export type Permission = (typeof PERMISSIONS)[number];
export type Role = "owner" | "admin" | "editor" | "staff" | "viewer" | "client";
export type Audience = "admin" | "storefront";
export type SessionKind = "user" | "ghost";
export const PERMISSION_GROUPS = {
  "account.security": ["account.password", "account.totp", "users.resetPassword", "users.transferOwner", "users.delete"],
} as const satisfies Record<string, readonly Permission[]>;
export const PERMISSION_LABELS: Record<Permission, string> = {
  "dashboard.view": "Xem tổng quan", "pages.view": "Xem trang", "pages.edit": "Sửa trang", "pages.publish": "Xuất bản trang",
  "pages.structure": "Sắp xếp cấu trúc trang", "content.edit": "Sửa nội dung", "media.view": "Xem thư viện", "media.manage": "Quản lý thư viện",
  "leads.view": "Xem yêu cầu tư vấn", "leads.manage": "Quản lý yêu cầu tư vấn", "theme.manage": "Quản lý giao diện", "domains.manage": "Quản lý tên miền",
  "email.manage": "Quản lý email", "billing.view": "Xem thanh toán", "users.view": "Xem nhân viên", "users.manage": "Quản lý nhân viên",
  "settings.manage": "Quản lý cài đặt", "audit.view": "Xem nhật ký", "clients.view": "Xem khách hàng", "clients.manage": "Quản lý khách hàng",
  "bookings.view": "Xem lịch hẹn", "bookings.manage": "Quản lý lịch hẹn", "account.password": "Đổi mật khẩu", "account.totp": "Quản lý xác thực hai bước",
  "users.resetPassword": "Đặt lại mật khẩu nhân viên", "users.transferOwner": "Chuyển chủ sở hữu", "users.delete": "Xóa nhân viên",
  "storefront.account": "Tài khoản khách hàng", "storefront.cart": "Giỏ hàng", "storefront.booking": "Đặt lịch hẹn",
  "site.backup": "Sao lưu website",
};
const storefront = PERMISSIONS.filter(p => p.startsWith("storefront."));
const owner = PERMISSIONS.filter(p => !p.startsWith("storefront."));
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  owner,
  admin: owner.filter(p => p !== "users.transferOwner" && p !== "site.backup"),
  editor: ["dashboard.view", "pages.view", "pages.edit", "pages.publish", "pages.structure", "content.edit", "media.view", "media.manage", "account.password", "account.totp"],
  staff: ["dashboard.view", "leads.view", "leads.manage", "clients.view", "bookings.view", "bookings.manage", "media.view", "account.password", "account.totp"],
  viewer: ["dashboard.view", "pages.view", "media.view", "account.password", "account.totp"],
  client: [],
};
const policySchema = z.object({ deny: z.array(z.string()).optional() });
export function effectivePermissions({ role, kind = "user", audience, policy }: { role: Role; kind?: SessionKind; audience: Audience; policy?: unknown }): ReadonlySet<Permission> {
  const permissions = new Set(audience === "storefront" ? kind === "ghost" ? [] : storefront
    : role === "client" ? [] : kind === "ghost" ? owner : ROLE_PERMISSIONS[role]);
  if (kind === "ghost") for (const p of PERMISSION_GROUPS["account.security"]) permissions.delete(p);
  const parsed = policySchema.safeParse(policy ?? {});
  for (const name of parsed.success ? parsed.data.deny ?? [] : []) {
    if (name === "account.security") PERMISSION_GROUPS[name].forEach(p => permissions.delete(p));
    else permissions.delete(name as Permission);
  }
  return permissions;
}
export function hasPermission(permissions: ReadonlySet<Permission>, permission: Permission): boolean { return permissions.has(permission); }
export class ForbiddenError extends Error {
  readonly status = 403;
  constructor() { super("Bạn không có quyền thực hiện thao tác này"); }
}
