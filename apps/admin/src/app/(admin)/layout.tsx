import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell } from "@solar/ui";
import { getAdminAccountName, requirePagePermission } from "../../lib/auth.ts";
import { getSiteEntitlements } from "../../lib/entitlements.ts";
import { adminNav } from "../../lib/nav.ts";
import { ActionForm } from "../../components/ActionForm.tsx";
import { logoutAction } from "../actions.ts";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePagePermission("session");
  if (session.mustChangePassword) redirect("/doi-mat-khau");
  const can = await getSiteEntitlements();
  const pathname = (await headers()).get("x-admin-path");
  const name = await getAdminAccountName();
  return <AdminShell brand="Solar · Quản trị website" nav={adminNav({ permissions: session.permissions, can, pathname })}
    banners={session.kind === "ghost" ? <p>Bạn đang ở phiên hỗ trợ của quản trị nền tảng</p> : undefined}
    // E15-S06: add the maintenance/read-only banner to this slot.
    account={<div className="space-y-3"><p className="break-words text-sm font-semibold">{name ?? (session.kind === "ghost" ? "Hỗ trợ nền tảng" : "Tài khoản của tôi")}</p><ActionForm action={logoutAction} label="Đăng xuất" permalink="/" secondary /></div>}>
    {children}
  </AdminShell>;
}
