"use client";
import { useActionState, useId, useState } from "react";
import type { AbTest } from "@solar/db";
import { UpgradeRequest } from "../../../../components/UpgradeRequest.tsx";
import { saveLandingAbTest } from "../actions.ts";

const field = "min-h-11 w-full min-w-0 rounded-input border border-line/30 bg-bg px-3 py-2 font-normal text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
const button = "inline-flex min-h-11 items-center justify-center rounded-button bg-primary px-5 py-2 font-medium text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60";
const fields = [
  ["lead", "Tiêu đề B – dòng đầu"], ["highlight", "Tiêu đề B – phần nhấn mạnh"],
  ["sub", "Tiêu đề B – dòng phụ"], ["subHighlight", "Tiêu đề B – phần nhấn mạnh phụ"], ["ctaLabel", "Nhãn nút B"],
] as const;
type Copy = Pick<AbTest, "title" | "ctaLabel">;
type Stats = { A: { views: number; leads: number }; B: { views: number; leads: number } };
export function AbTestPanel({ pageId, abTest, initial, stats, allowed, locales, hasHero }: {
  pageId: string; abTest: AbTest | null; initial: Copy; stats: Stats | null; allowed: boolean; locales: string[]; hasHero: boolean;
}) {
  const id = useId(), [upgrade, setUpgrade] = useState(false);
  const [state, submit, pending] = useActionState(saveLandingAbTest, {}, `/trang/${pageId}`);
  const copy = abTest ?? initial, english = locales.includes("en"), running = abTest?.status === "running";
  return <section aria-labelledby={`${id}-heading`} className="min-w-0 space-y-4 rounded-card border border-line/20 bg-bg-elevated p-4 sm:p-6">
    <h2 id={`${id}-heading`} className="text-lg font-semibold text-fg">Thử nghiệm A/B</h2>
    {!allowed ? <>
      <p className="text-sm text-fg-muted">Gói hiện tại không hỗ trợ thử nghiệm A/B tiêu đề và nút tư vấn.</p>
      <button type="button" onClick={() => setUpgrade(true)} className={button}>Nâng cấp gói</button>
      {upgrade && <UpgradeRequest feature="abTest" onClose={() => setUpgrade(false)} />}
    </> : <>
      <p className="text-sm text-fg-muted">Khách được chia đều giữa nội dung gốc A và phiên bản B. Lưu B khi đang chạy sẽ giữ số liệu hiện tại.</p>
      {!hasHero && <p className="text-sm text-fg-muted">Thêm và bật hero trước khi bắt đầu thử nghiệm.</p>}
      {abTest?.status === "ended" && <p className="text-sm text-fg-muted">Đã kết thúc · Phiên bản {abTest.winner} thắng. Bắt đầu lại sẽ tạo bộ số liệu mới.</p>}
      <form action={submit} aria-describedby={state.error ? `${id}-error` : undefined} className="min-w-0 space-y-4">
        <input type="hidden" name="pageId" value={pageId} /><input type="hidden" name="action" value="start" />
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          {fields.map(([key, label]) => {
            const value = key === "ctaLabel" ? copy.ctaLabel : copy.title[key], max = key === "ctaLabel" ? 80 : 60;
            return <div key={key} className="min-w-0 space-y-3">
              <label className="block min-w-0 space-y-2 font-medium text-fg">{label}<input name={key} maxLength={max} autoComplete="off" defaultValue={value.vi} className={field} /></label>
              {english ? <label className="block min-w-0 space-y-2 font-medium text-fg">{label} (EN)<input name={`${key}En`} maxLength={max} autoComplete="off" defaultValue={value.en} className={field} /></label> : <input type="hidden" name={`${key}En`} value={value.en ?? ""} />}
            </div>;
          })}
        </div>
        <button disabled={pending || !hasHero} className={button}>{pending ? "Đang lưu…" : running ? "Lưu phiên bản B" : "Bắt đầu thử nghiệm"}</button>
        {state.error && <p id={`${id}-error`} role="alert" className="text-sm text-danger">{state.error}</p>}
        {state.message && <p role="status" className="text-sm text-fg-muted">{state.message}</p>}
      </form>
      {stats && <div className="min-w-0 overflow-x-auto">
        <table className="w-full text-left text-sm tabular-nums">
          <caption className="pb-3 text-left font-medium text-fg">Kết quả thử nghiệm</caption>
          <thead className="text-fg-muted"><tr>{["Phiên bản", "Lượt xem", "Lead", "Tỉ lệ lead"].map(text => <th key={text} scope="col" className="px-2 py-3">{text}</th>)}</tr></thead>
          <tbody>{(["A", "B"] as const).map(variant => <tr key={variant} className="border-t border-line/20 text-fg">
            <th scope="row" className="px-2 py-3">{variant}</th><td className="px-2 py-3">{stats[variant].views}</td><td className="px-2 py-3">{stats[variant].leads}</td>
            <td className="px-2 py-3">{(stats[variant].views ? stats[variant].leads / stats[variant].views * 100 : 0).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%</td>
          </tr>)}</tbody>
        </table>
        <p className="text-sm text-fg-muted">Không tính lead spam. Lượt xem là số lần tải trang.</p>
      </div>}
      {running && hasHero && <div className="flex flex-wrap gap-3">{(["A", "B"] as const).map(winner => <form key={winner} action={submit}>
        <input type="hidden" name="pageId" value={pageId} /><input type="hidden" name="action" value="end" /><input type="hidden" name="winner" value={winner} />
        <button disabled={pending} className={button}>Chọn {winner} thắng</button>
      </form>)}</div>}
    </>}
  </section>;
}
