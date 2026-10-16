import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePagePermission } from "../../lib/auth.ts";
import { ActionForm } from "../../components/ActionForm.tsx";
import { logoutAction } from "../actions.ts";

const links = [["/", "Tổng quan", "dashboard.view"], ["/ten-mien", "Tên miền", "domains.manage"], ["/goi", "Gói", "billing.view"], ["/nhan-vien", "Tài khoản & nhân viên", "users.view"], ["/doi-mat-khau", "Đổi mật khẩu", "account.password"], ["/tai-khoan/bao-mat", "Bảo mật", "account.totp"]] as const;
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePagePermission("session");
  if (session.mustChangePassword) redirect("/doi-mat-khau");
  return <div className="space-y-6"><nav aria-label="Quản trị site" className="flex flex-wrap gap-x-5 gap-y-3 border-b border-line/15 pb-5">{links.filter(([, , permission]) => session.permissions.has(permission)).map(([href, label]) => <Link prefetch={false} key={href} href={href}>{label}</Link>)}</nav>
    {children}
    <div className="max-w-xs border-t border-line/15 pt-5"><ActionForm action={logoutAction} label="Đăng xuất" permalink="/" /></div>
  </div>;
}
