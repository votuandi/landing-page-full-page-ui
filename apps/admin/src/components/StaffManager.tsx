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
const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
const field = `min-h-11 w-full rounded-input border border-line/20 bg-bg px-3 py-2 text-fg ${ring}`;
const button = `inline-flex min-h-11 items-center justify-center rounded-button border border-line/20 px-4 py-2 text-sm font-medium text-fg hover:bg-bg-tint disabled:cursor-not-allowed disabled:opacity-50 ${ring}`;
const primary = `inline-flex min-h-11 w-full items-center justify-center rounded-button bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-50 ${ring}`;
const statusTones = { active: "bg-success/10 text-success", invited: "bg-primary/10 text-primary", locked: "bg-danger/10 text-danger", unverified: "bg-bg-tint text-fg-muted", disabled: "bg-bg-tint text-fg-muted" };
const subscribeNothing = () => () => {};

function InviteLink({ url }: { url: string }) {
  const [copied, setCopied] = useState<boolean>();
  return <div className="mt-3 space-y-2">
    <label className="block space-y-1"><span className="font-medium text-fg">Link mời dùng một lần</span>
      <input readOnly value={url} translate="no" className={field} onFocus={event => event.currentTarget.select()} /></label>
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" className={button} onClick={() => navigator.clipboard.writeText(url).then(() => setCopied(true), () => setCopied(false))}>Sao chép link</button>
      {copied !== undefined && <span className="text-fg-muted">{copied ? "Đã sao chép" : "Không sao chép được. Hãy chọn link và sao chép thủ công."}</span>}
    </div>
  </div>;
}

export function StaffManager({ data, access }: { data: StaffList; access: Access }) {
  const [result, setResult] = useState<ActionResult>({}), [pending, start] = useTransition();
  const [upgrade, setUpgrade] = useState(false), [conversionRole, setConversionRole] = useState("staff");
  const formRef = useRef<HTMLFormElement>(null), statusRef = useRef<HTMLDivElement>(null);
  const ready = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const permissions = new Set(access.permissions), manage = permissions.has("users.manage"), remove = permissions.has("users.delete");
  const owner = access.role === "owner" && access.kind !== "ghost", full = data.used >= data.max;
  function call(action: AdminAction, form: FormData, reset = false) {
    setResult({});
    start(async () => {
      try {
        const response = await action({}, form); setResult(response);
        // The panel can sit far from the control that was used; keep errors and one-time links in view.
        if (response.error || response.url) statusRef.current?.focus();
        if (reset && response.ok) formRef.current?.reset();
      } catch { setResult({ error: "Không thể kết nối. Vui lòng thử lại." }); statusRef.current?.focus(); }
    });
  }
  function rowAction(action: AdminAction, id: string, extra: Record<string, string> = {}) {
    const form = new FormData(); form.set("id", id);
    for (const [key, value] of Object.entries(extra)) form.set(key, value);
    call(action, form);
  }
  const upgradeButton = <button type="button" className={button} onClick={() => setUpgrade(true)}>Yêu cầu nâng gói</button>;
  return <div className="space-y-6">
    <div className="space-y-3 rounded-card border border-line/20 bg-bg-elevated p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-fg"><span className="text-2xl font-semibold tabular-nums">{data.used}/{data.max}</span> tài khoản nhân viên trong gói</p>
        <div className="flex flex-wrap gap-2">
          {manage && full && !result.limit && upgradeButton}
          {manage && <a href="#moi-nhan-vien" className={`${button} lg:hidden`}>Mời nhân viên</a>}
        </div>
      </div>
      <div aria-hidden="true" className="h-2 overflow-hidden rounded-pill bg-bg-tint"><div className={`h-full rounded-pill ${full ? "bg-danger" : "bg-primary"}`} style={{ width: `${data.max ? Math.min(100, data.used / data.max * 100) : 100}%` }} /></div>
      <p className="text-sm text-fg-muted">{full ? "Đã dùng hết chỗ của gói. Nâng gói để mời thêm nhân viên." : "Tài khoản khách hàng không tính vào giới hạn này."}</p>
    </div>
    <noscript><p className="text-sm text-fg-muted">Danh sách vẫn đọc được khi tắt JavaScript. Bật JavaScript để quản lý nhân viên.</p></noscript>
    <div ref={statusRef} tabIndex={-1} role="status" aria-live="polite" aria-atomic="true" className="sticky top-2 z-10 scroll-mt-2 focus:outline-none">
      {(result.error || result.message) && <div className={`break-words rounded-card border bg-bg-elevated p-4 text-sm shadow-lg ${result.error ? "border-danger/40 text-danger" : "border-line/20 text-fg"}`}>
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0">{result.error ?? result.message}</p>
          <button type="button" className={`${button} shrink-0`} onClick={() => setResult({})}>Đóng<span className="sr-only"> thông báo</span></button>
        </div>
        {result.url && <InviteLink key={result.url} url={result.url} />}
        {result.limit && <div className="mt-3">{upgradeButton}</div>}
        {result.clientId && owner && <button type="button" disabled={pending} className={`${button} mt-3`} onClick={() => {
          if (window.confirm(`Chuyển tài khoản khách hàng này thành ${roleLabels[conversionRole as typeof roles[number]]}? Mọi phiên đăng nhập của khách hàng sẽ bị thu hồi.`)) rowAction(convertClientToStaff, result.clientId!, { role: conversionRole });
        }}>Xác nhận chuyển thành nhân viên</button>}
      </div>}
    </div>
    {upgrade && <UpgradeRequest feature="limit:users" onClose={() => setUpgrade(false)} />}
    <div className={`grid items-start gap-6 ${manage ? "lg:grid-cols-[minmax(0,1fr)_20rem]" : ""}`}>
      <section className="min-w-0 space-y-3">
        <h2 id="danh-sach-nhan-vien" className="text-lg font-semibold text-fg">Nhân viên của site</h2>
        <fieldset aria-labelledby="danh-sach-nhan-vien" disabled={!ready || pending} aria-busy={pending} className="min-w-0">
          {!data.users.length && <p className="text-fg-muted">Chưa có nhân viên.</p>}
          <ul className="space-y-3">
            {data.users.map(row => {
              const self = row.id === access.accountId, allowed = !self && (row.role !== "owner" || access.role === "owner");
              return <li key={row.id} className="min-w-0 rounded-card border border-line/20 bg-bg-elevated p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 break-words"><h3 className="font-semibold text-fg">{row.name}{self && <span className="font-normal text-fg-muted"> (Bạn)</span>}</h3><p className="text-sm text-fg-muted">{[row.email, row.phone, row.username].filter(Boolean).join(" · ")}</p></div>
                  <span className={`shrink-0 rounded-pill px-2 py-0.5 text-xs font-medium ${statusTones[row.status]}`}>{statusLabels[row.status]}</span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                  <div><dt className="text-fg-muted">Vai trò</dt><dd className="font-medium text-fg">{roleLabels[row.role]}</dd></div>
                  <div className="col-span-2 sm:col-span-1 sm:order-last"><dt className="text-fg-muted">Đăng nhập gần nhất</dt><dd className="tabular-nums text-fg">{staffDate(row.lastLoginAt)}</dd></div>
                  <div className="row-start-1 col-start-2 sm:row-auto sm:col-auto"><dt className="text-fg-muted">Xác thực hai bước</dt><dd className="text-fg">{row.hasTotp ? "Đã bật" : "Chưa bật"}</dd></div>
                </dl>
                {allowed && (manage || remove) && <details className="mt-3 border-t border-line/15 pt-1">
                  <summary className={`min-h-11 cursor-pointer rounded-button py-2.5 text-sm font-semibold text-fg ${ring}`}>Thao tác<span className="sr-only"> với {row.name}</span></summary>
                  <div className="space-y-4 pb-1 pt-2">
                    {manage && <form className="flex min-w-0 flex-wrap items-end gap-2" onSubmit={event => {
                      event.preventDefault();
                      if (window.confirm(`Đổi vai trò của ${row.name}? Nhân viên sẽ cần đăng nhập lại.`)) call(changeStaffRole, new FormData(event.currentTarget));
                    }}>
                      <input type="hidden" name="id" value={row.id} />
                      <label className="block min-w-0 flex-1 basis-48 space-y-1"><span className="text-sm text-fg-muted">Vai trò mới của {row.name}</span><select key={row.role} name="role" className={field} defaultValue={row.role}>
                        {row.role === "owner" && <option value="owner" disabled>{roleLabels.owner}</option>}
                        {roles.map(role => <option key={role} value={role}>{roleLabels[role]}</option>)}
                      </select></label>
                      <button type="submit" className={button}>Đổi vai trò<span className="sr-only"> {row.name}</span></button>
                    </form>}
                    <div className="flex flex-wrap gap-2">
                      {manage && row.status === "invited" && <button type="button" className={button} onClick={() => rowAction(resendStaffInvite, row.id)}>Gửi lại lời mời<span className="sr-only"> {row.name}</span></button>}
                      {manage && ["active", "locked"].includes(row.status) && <button type="button" className={button} onClick={() => {
                        const locked = row.status === "active";
                        if (!locked || window.confirm(`Khóa ${row.name}? Mọi phiên đăng nhập và link chưa dùng sẽ bị thu hồi.`)) rowAction(lockStaff, row.id, { locked: String(locked) });
                      }}>{row.status === "locked" ? "Mở khóa" : "Khóa"}<span className="sr-only"> {row.name}</span></button>}
                      {owner && permissions.has("users.transferOwner") && row.status === "active" && row.role !== "owner" && <button type="button" className={button} onClick={() => {
                        if (window.confirm(`Chuyển quyền chủ sở hữu cho ${row.name}? Bạn sẽ trở thành quản trị viên và cần đăng nhập lại.`)) rowAction(transferStaffOwner, row.id);
                      }}>Chuyển quyền chủ sở hữu<span className="sr-only"> cho {row.name}</span></button>}
                      {owner && manage && row.status === "active" && row.role !== "owner" && <button type="button" className={button} onClick={() => {
                        if (window.confirm(`Chuyển ${row.name} thành khách hàng? Tài khoản sẽ mất quyền vào CMS và mọi phiên bị thu hồi.`)) rowAction(convertStaffToClient, row.id);
                      }}>Chuyển thành khách hàng<span className="sr-only"> {row.name}</span></button>}
                      {remove && <button type="button" className={`${button} border-danger/40 text-danger hover:bg-danger/10`} onClick={() => {
                        if (window.confirm(`Gỡ ${row.name} khỏi site? Tài khoản sẽ bị xóa và mọi phiên đăng nhập bị thu hồi.`)) rowAction(removeStaff, row.id);
                      }}>Gỡ<span className="sr-only"> {row.name}</span></button>}
                    </div>
                  </div>
                </details>}
              </li>;
            })}
          </ul>
        </fieldset>
      </section>
      {manage && <section id="moi-nhan-vien" aria-labelledby="tieu-de-moi" className="min-w-0 scroll-mt-4 space-y-3 lg:sticky lg:top-4">
        <h2 id="tieu-de-moi" className="text-lg font-semibold text-fg">Mời nhân viên</h2>
        <form ref={formRef} onSubmit={event => {
          event.preventDefault(); const form = new FormData(event.currentTarget);
          setConversionRole(String(form.get("role"))); call(inviteStaff, form, true);
        }}>
          <fieldset aria-labelledby="tieu-de-moi" disabled={!ready || pending} className="min-w-0 space-y-4 rounded-card border border-line/20 bg-bg-elevated p-4">
            <label className="block space-y-1"><span className="text-sm font-medium text-fg">Họ và tên</span><input name="name" autoComplete="off" required maxLength={100} className={field} /></label>
            <label className="block space-y-1"><span className="text-sm font-medium text-fg">Email hoặc số điện thoại</span><input name="identifier" autoComplete="off" spellCheck={false} required maxLength={254} className={field} /></label>
            <label className="block space-y-1"><span className="text-sm font-medium text-fg">Vai trò</span><select name="role" className={field} defaultValue="staff">{roles.map(role => <option key={role} value={role}>{roleLabels[role]}</option>)}</select></label>
            <p className="text-sm text-fg-muted">Email nhận lời mời tự động. Với số điện thoại, bạn nhận link dùng một lần để gửi qua Zalo.</p>
            <button type="submit" className={primary}>{pending ? "Đang xử lý…" : "Gửi lời mời"}</button>
          </fieldset>
        </form>
      </section>}
    </div>
  </div>;
}
