"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "../lib/action.ts";
import { previewProductCsv, importProductCsv } from "../app/(admin)/noi-dung/actions.ts";

const button = "inline-flex min-h-11 items-center justify-center rounded-button border border-line/20 px-3 text-sm text-fg hover:bg-bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40";
const labels = { create: "Thêm mới", update: "Cập nhật", unchanged: "Không đổi", error: "Lỗi" };
export function ProductCsv() {
  const [text, setText] = useState(""), [result, setResult] = useState<ActionResult>({});
  const [pending, startTransition] = useTransition(), router = useRouter();
  const errorId = useId();
  const rows = result.csvRows;
  const run = (confirm: boolean) => startTransition(async () => {
    const form = new FormData(); form.set("text", text);
    const response = await (confirm ? importProductCsv : previewProductCsv)({}, form);
    setResult(response);
    if (confirm && response.ok) { setText(""); router.refresh(); }
  });
  return <section aria-label="Nhập xuất CSV sản phẩm" aria-busy={pending} className="min-w-0 space-y-3 rounded-card border border-line/15 bg-bg-elevated p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-semibold text-fg">Nhập / xuất CSV</h2>
      <a href="/api/san-pham/csv" download className={button}>Xuất CSV</a>
    </div>
    <p className="text-sm text-fg-muted">Tối đa 500 kB, 1000 dòng. Dùng UTF-8 và dấu phẩy (,), không dùng dấu chấm phẩy (;). Xuất file trước để giữ đúng các cột. Không xóa sản phẩm vắng mặt trong file.</p>
    <noscript><p className="text-sm text-fg-muted">Bật JavaScript để xem trước và nhập CSV.</p></noscript>
    <label className="grid min-w-0 gap-2 text-sm text-fg">File CSV sản phẩm
      <input type="file" name="csv" aria-describedby={result.error ? errorId : undefined} accept=".csv,text/csv" disabled={pending} className="min-h-11 w-full min-w-0 rounded-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" onChange={event => {
        const file = event.target.files?.[0]; setText(""); setResult({});
        if (!file) return;
        if (file.size > 500_000) { setResult({ error: "File CSV không được vượt quá 500 kB" }); return; }
        startTransition(async () => {
          try { setText(await file.text()); }
          catch { setResult({ error: "Không đọc được file CSV. Vui lòng chọn lại." }); }
        });
      }} />
    </label>
    <div className="flex flex-wrap gap-3">
      <button type="button" className={button} disabled={pending || !text} onClick={() => run(false)}>Xem trước</button>
      <button type="button" className={`${button} bg-primary text-on-primary`} disabled={pending || !rows?.length || rows.some(r => r.kind === "error") || !rows.some(r => r.kind === "create" || r.kind === "update")} onClick={() => run(true)}>Xác nhận nhập</button>
    </div>
    <p role="status" className="text-sm text-fg-muted">{pending ? "Đang xử lý…" : result.message ?? (rows?.length === 0 ? "File không có dòng sản phẩm." : "")}</p>
    {result.error && <p id={errorId} role="alert" className="break-words text-sm text-danger">{result.error}</p>}
    {rows && rows.length > 0 && <table className="w-full table-fixed text-left text-sm text-fg">
      <caption className="mb-2 text-left text-fg-muted">Xem trước {rows.length} dòng sản phẩm</caption>
      <thead><tr><th scope="col" className="w-14 p-2">Dòng</th><th scope="col" className="p-2">Sản phẩm</th><th scope="col" className="p-2">Kết quả</th></tr></thead>
      <tbody>{rows.map(row => <tr key={row.line} className="border-t border-line/15 align-top">
        <td className="p-2">{row.line}</td><td className="break-all p-2">{row.slug}</td>
        <td className="break-words p-2">{labels[row.kind]}{row.errors.map((error, i) => <p key={i} className="text-danger">Dòng {row.line}, cột {error.column}: {error.message}</p>)}</td>
      </tr>)}</tbody>
    </table>}
  </section>;
}
