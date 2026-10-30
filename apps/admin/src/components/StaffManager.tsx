"use client";
import { useRef, useState, useSyncExternalStore, useTransition } from "react";
import type { Role, SessionKind } from "@solar/auth";
import type { createStaff } from "../lib/staff.ts";
import type { ActionResult, AdminAction } from "../lib/action.ts";
import { roleLabels, staffDate, statusLabels } from "../lib/staffLabels.ts";
import { inviteStaff, resendStaffInvite, changeStaffRole, lockStaff, removeStaff, transferStaffOwner, convertClientToStaff, convertStaffToClient } from "../app/(admin)/nhan-vien/actions.ts";
import { UpgradeRequest } from "./UpgradeRequest.tsx";

type StaffList = Awaited<ReturnType<ReturnType<typeof createStaff>["list"]>>;
type Access = { accountId?: string; role?: Role; kind: SessionKind; permissions: string[] };
const roles = ["admin", "editor", "staff", "viewer"] as const;
const field = "min-h-11 w-full rounded-input border border-line/20 bg-bg px-3 py-2 text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
const button = "min-h-11 rounded-button border border-line/20 px-4 py-2 text-sm font-medium text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50";
const subscribeNothing = () => () => {};

export function StaffManager({ data, access }: { data: StaffList; access: Access }) {
  const [result, setResult] = useState<ActionResult>({}), [pending, start] = useTransition();
  const [upgrade, setUpgrade] = useState(false), [conversionRole, setConversionRole] = useState("staff");
  const formRef = useRef<HTMLFormElement>(null), statusRef = useRef<HTMLDivElement>(null);
  const ready = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const permissions = new Set(access.permissions), manage = permissions.has("users.manage");
  const owner = access.role === "owner" && access.kind !== "ghost";
  function call(action: AdminAction, form: FormData, reset = false) {
    setResult({});
    start(async () => {
      try {
        const response = await action({}, form); setResult(response);
        if (response.error) statusRef.current?.focus();
        if (reset && response.ok) formRef.current?.reset();
      } catch { setResult({ error: "Không thể kết nối. Vui lòng thử lại." }); statusRef.current?.focus(); }
    });
  }
  function rowAction(action: AdminAction, id: string, extra: Record<string, string> = {}) {
    const form = new FormData(); form.set("id", id);
    for (const [key, value] of Object.entries(extra)) form.set(key, value);
    call(action, form);
  }
  return <div className="max-w-5xl space-y-6">
    <p className="text-fg-muted">Đang dùng {data.used}/{data.max} tài khoản nhân viên trong gói. Tài khoản khách hàng không tính vào giới hạn này.</p>
    <noscript><p>Danh sách vẫn đọc được khi tắt JavaScript. Bật JavaScript để quản lý nhân viên.</p></noscript>
    <div ref={statusRef} tabIndex={-1} role="status" aria-live="polite" aria-atomic="true" className={`break-words text-sm ${result.error ? "text-danger" : "text-fg"}`}>
      {result.error ?? result.message}
      {result.url && <p className="mt-2">Link mời để gửi riêng qua Zalo: <a className="break-all underline" href={result.url}>{result.url}</a></p>}
      {result.limit && <button type="button" className={`${button} mt-3`} onClick={() => setUpgrade(true)}>Yêu cầu nâng gói</button>}
      {result.clientId && owner && <button type="button" disabled={pending} className={`${button} mt-3`} onClick={() => {
        if (window.confirm(`Chuyển tài khoản khách hàng này thành ${roleLabels[conversionRole as typeof roles[number]]}? Mọi phiên đăng nhập của khách hàng sẽ bị thu hồi.`)) rowAction(convertClientToStaff, result.clientId!, { role: conversionRole });
      }}>Xác nhận chuyển thành nhân viên</button>}
    </div>
    {upgrade && <UpgradeRequest feature="limit:users" onClose={() => setUpgrade(false)} />}
    <fieldset disabled={!ready || pending} aria-busy={pending} className="min-w-0 space-y-4">
      <legend className="mb-3 text-lg font-semibold text-fg">Nhân viên của site</legend>
      {!data.users.length && <p className="text-fg-muted">Chưa có nhân viên.</p>}
      <ul className="space-y-4">
        {data.users.map(row => {
          const self = row.id === access.accountId, allowed = !self && (row.role !== "owner" || access.role === "owner");
          return <li key={row.id} className="min-w-0 space-y-4 rounded-card border border-line/20 bg-bg-elevated p-4 sm:p-6">
            <div className="min-w-0 break-words"><h2 className="font-semibold text-fg">{row.name}{self ? " (Bạn)" : ""}</h2><p className="text-sm text-fg-muted">{row.email ?? row.phone ?? "Chưa có email/SĐT"}{row.email && row.phone ? ` · ${row.phone}` : ""}</p></div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div><dt className="text-fg-muted">Vai trò</dt><dd>{roleLabels[row.role]}</dd></div>
              <div><dt className="text-fg-muted">Trạng thái</dt><dd>{statusLabels[row.status]}</dd></div>
              <div><dt className="text-fg-muted">Đăng nhập gần nhất</dt><dd>{staffDate(row.lastLoginAt)}</dd></div>
              <div><dt className="text-fg-muted">Xác thực hai bước</dt><dd>{row.hasTotp ? "Đã bật" : "Chưa bật"}</dd></div>
            </dl>
            {allowed && <div className="flex flex-wrap items-end gap-3">
              {manage && <form className="flex min-w-0 flex-wrap items-end gap-2" onSubmit={event => {
                event.preventDefault();
                if (window.confirm(`Đổi vai trò của ${row.name}? Nhân viên sẽ cần đăng nhập lại.`)) call(changeStaffRole, new FormData(event.currentTarget));
              }}>
                <input type="hidden" name="id" value={row.id} />
                <label className="block space-y-1"><span className="text-sm text-fg-muted">Vai trò mới của {row.name}</span><select key={row.role} name="role" className={field} defaultValue={row.role}>
                  {row.role === "owner" && <option value="owner" disabled>Chủ sở hữu</option>}
                  {roles.map(role => <option key={role} value={role}>{roleLabels[role]}</option>)}
                </select></label><button type="submit" className={button}>Đổi vai trò<span className="sr-only"> {row.name}</span></button>
              </form>}
              {manage && row.status === "invited" && <button type="button" className={button} onClick={() => rowAction(resendStaffInvite, row.id)}>Gửi lại lời mời<span className="sr-only"> {row.name}</span></button>}
              {manage && ["active", "locked"].includes(row.status) && <button type="button" className={button} onClick={() => {
                const locked = row.status === "active";
                if (!locked || window.confirm(`Khóa ${row.name}? Mọi phiên đăng nhập và link chưa dùng sẽ bị thu hồi.`)) rowAction(lockStaff, row.id, { locked: String(locked) });
              }}>{row.status === "locked" ? "Mở khóa" : "Khóa"}<span className="sr-only"> {row.name}</span></button>}
              {permissions.has("users.delete") && <button type="button" className={`${button} text-danger`} onClick={() => {
                if (window.confirm(`Gỡ ${row.name} khỏi site? Tài khoản sẽ bị xóa và mọi phiên đăng nhập bị thu hồi.`)) rowAction(removeStaff, row.id);
              }}>Gỡ<span className="sr-only"> {row.name}</span></button>}
              {owner && permissions.has("users.transferOwner") && row.status === "active" && row.role !== "owner" && <button type="button" className={button} onClick={() => {
                if (window.confirm(`Chuyển quyền chủ sở hữu cho ${row.name}? Bạn sẽ trở thành quản trị viên và cần đăng nhập lại.`)) rowAction(transferStaffOwner, row.id);
              }}>Chuyển quyền chủ sở hữu<span className="sr-only"> cho {row.name}</span></button>}
              {owner && manage && row.status === "active" && <button type="button" className={button} onClick={() => {
                if (window.confirm(`Chuyển ${row.name} thành khách hàng? Tài khoản sẽ mất quyền vào CMS và mọi phiên bị thu hồi.`)) rowAction(convertStaffToClient, row.id);
              }}>Chuyển thành khách hàng<span className="sr-only"> {row.name}</span></button>}
            </div>}
          </li>;
        })}
      </ul>
    </fieldset>
    {manage && <form ref={formRef} onSubmit={event => {
      event.preventDefault(); const form = new FormData(event.currentTarget);
      setConversionRole(String(form.get("role"))); call(inviteStaff, form, true);
    }}>
      <fieldset disabled={!ready || pending} className="min-w-0 space-y-4 rounded-card border border-line/20 bg-bg-elevated p-4 sm:p-6">
        <legend className="px-1 text-lg font-semibold text-fg">Mời nhân viên</legend>
        <p className="text-sm text-fg-muted">Email nhận lời mời tự động. Với số điện thoại, sao chép link dùng một lần để gửi riêng qua Zalo.</p>
        <label className="block space-y-2"><span>Họ và tên</span><input name="name" autoComplete="name" required maxLength={100} className={field} /></label>
        <label className="block space-y-2"><span>Email hoặc số điện thoại</span><input name="identifier" autoComplete="off" required maxLength={254} className={field} /></label>
        <label className="block space-y-2"><span>Vai trò</span><select name="role" className={field} defaultValue="staff">{roles.map(role => <option key={role} value={role}>{roleLabels[role]}</option>)}</select></label>
        <button type="submit" className={`${button} bg-primary text-on-primary`}>{pending ? "Đang xử lý…" : "Gửi lời mời"}</button>
      </fieldset>
    </form>}
  </div>;
}
