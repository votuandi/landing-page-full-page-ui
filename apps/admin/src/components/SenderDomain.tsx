"use client";
import { useState, useSyncExternalStore, useTransition } from "react";
import type { SenderDnsRecord } from "@solar/leads";
import type { ActionResult, AdminAction } from "../lib/action.ts";
import { addSenderDomain, checkSenderDomain, removeSenderDomain } from "../app/(admin)/cai-dat/ten-mien-gui/actions.ts";

const field = "min-h-11 w-full rounded-input border border-line/20 bg-bg px-3 py-2 text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50";
const button = `min-h-11 rounded-button border border-line/20 px-4 py-2 text-sm font-medium text-fg ${focus}`;
const primary = `min-h-11 rounded-button bg-primary px-4 py-2 text-sm font-semibold text-on-primary ${focus}`;
const subscribeNothing = () => () => {};
const statuses = { pending: "Chờ xác minh", verified: "Đã xác minh", failed: "Xác minh thất bại" };
const statusTone = { pending: "bg-bg-tint text-fg-muted", verified: "bg-success/10 text-success", failed: "bg-danger/10 text-danger" };
type DomainView = { hostname: string; status: keyof typeof statuses; records: SenderDnsRecord[]; initialized: boolean };

export function SenderDomain({ domain }: { domain: DomainView | null }) {
  const [result, setResult] = useState<ActionResult>({}), [pending, start] = useTransition();
  const ready = useSyncExternalStore(subscribeNothing, () => true, () => false);
  function call(action: AdminAction, form = new FormData()) {
    setResult({});
    start(async () => {
      try { setResult(await action({}, form)); }
      catch { setResult({ error: "Không thể kết nối. Vui lòng thử lại." }); }
    });
  }
  return <div className="min-w-0 max-w-4xl space-y-6">
    <p role="status" aria-live="polite" className={`break-words text-sm ${result.error ? "text-danger" : "text-fg"}`}>{result.error ?? result.message}</p>
    {!domain && <p className="max-w-prose text-sm text-fg-muted">Khi tên miền chưa xác minh hoặc gói dịch vụ không còn hỗ trợ, thông báo lead sẽ dùng tên miền nền tảng.</p>}
    {domain ? <section aria-labelledby="sender-domain-title" className="min-w-0 space-y-4 rounded-card border border-line/20 bg-bg-elevated p-4 sm:p-6">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <h2 id="sender-domain-title" className="min-w-0 break-all text-lg font-semibold text-fg" translate="no">{domain.hostname}</h2>
        <p className={`shrink-0 rounded-pill px-3 py-1 text-sm font-medium ${statusTone[domain.status]}`}>{statuses[domain.status]}</p>
      </div>
      <p className="break-words text-sm text-fg-muted">{domain.status === "verified"
        ? <>Thông báo lead đang gửi từ <code translate="no" className="break-all text-fg">no-reply@{domain.hostname}</code>.</>
        : "Thông báo lead đang gửi từ tên miền nền tảng cho tới khi xác minh xong."}</p>
      {!domain.initialized && <p className="text-sm text-danger">Tên miền chưa khởi tạo xong. Hãy xóa rồi thêm lại.</p>}
      <div className="space-y-3">
        <h3 className="font-medium text-fg">Bản ghi DNS cần thêm</h3>
        <p className="text-sm text-fg-muted">Sao chép chính xác tên, loại, giá trị và độ ưu tiên vào nơi quản lý DNS. Không thay bản ghi MX của hộp thư đang dùng. DNS có thể cần thời gian để cập nhật.</p>
        {!domain.records.length ? <p className="text-sm text-fg-muted">Chưa có bản ghi DNS.</p> : <ul className="space-y-3">
          {domain.records.map((record, index) => <li key={`${record.name}:${record.type}:${index}`} className="min-w-0 rounded-card border border-line/20 bg-bg p-3">
            <dl className="grid min-w-0 gap-2 text-sm sm:grid-cols-[8rem_minmax(0,1fr)]">
              <dt className="text-fg-muted">Tên</dt><dd className="min-w-0 break-all text-fg"><code translate="no" className="select-all">{record.name}</code></dd>
              <dt className="text-fg-muted">Loại</dt><dd className="text-fg" translate="no">{record.type}</dd>
              <dt className="text-fg-muted">Giá trị</dt><dd className="min-w-0 break-all text-fg"><code translate="no" className="select-all">{record.value}</code></dd>
              {record.priority !== undefined && <><dt className="text-fg-muted">Độ ưu tiên</dt><dd className="tabular-nums text-fg">{record.priority}</dd></>}
            </dl>
          </li>)}
        </ul>}
      </div>
      <fieldset disabled={!ready || pending} aria-busy={pending} className="flex flex-wrap gap-3">
        <legend className="sr-only">Thao tác với tên miền gửi</legend>
        <button type="button" className={primary} disabled={!domain.initialized} onClick={() => call(checkSenderDomain)}>{pending ? "Đang xử lý…" : "Kiểm tra"}</button>
        <button type="button" className={button} onClick={() => { if (window.confirm(`Xóa tên miền gửi ${domain.hostname}? Thông báo lead sẽ dùng tên miền nền tảng.`)) call(removeSenderDomain); }}>Xóa tên miền</button>
      </fieldset>
    </section> : <form onSubmit={event => { event.preventDefault(); call(addSenderDomain, new FormData(event.currentTarget)); }}>
      <fieldset disabled={!ready || pending} aria-busy={pending} className="min-w-0 space-y-4 rounded-card border border-line/20 bg-bg-elevated p-4 sm:p-6">
        <legend className="px-1 text-lg font-semibold text-fg">Thêm tên miền gửi</legend>
        <label className="block space-y-2"><span className="font-medium text-fg">Tên miền</span>
          <input name="hostname" type="text" inputMode="url" autoComplete="off" autoCapitalize="none" spellCheck={false} required maxLength={253} className={field} aria-describedby="sender-hostname-help" /></label>
        <p id="sender-hostname-help" className="text-sm text-fg-muted">Ví dụ mail.congty.vn. Dùng tên miền hoặc tên miền con mà công ty quản lý.</p>
        <button type="submit" className={primary}>{pending ? "Đang xử lý…" : "Thêm tên miền"}</button>
      </fieldset>
    </form>}
    <noscript><p className="text-sm text-fg-muted">Các bản ghi DNS vẫn hiển thị. Bật JavaScript để thêm, kiểm tra hoặc xóa tên miền.</p></noscript>
  </div>;
}
