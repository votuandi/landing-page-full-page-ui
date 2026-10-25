"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadMediaFiles } from "../lib/mediaUpload.ts";

type Progress = { name: string; message: string; error?: boolean };
export function MediaUpload() {
  const router = useRouter(), input = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Progress[]>([]), [busy, setBusy] = useState(false), [dragging, setDragging] = useState(false);
  const running = useRef(false);
  async function upload(files: File[]) {
    if (!files.length || running.current) return;
    running.current = true; setBusy(true);
    setRows(files.map(file => ({ name: file.name, message: "Đang chờ" })));
    const status = (index: number, message: string, error = false) => setRows(previous => previous.map((row, i) => i === index ? { ...row, message, error } : row));
    await uploadMediaFiles(files, status);
    running.current = false; setBusy(false); router.refresh();
    if (input.current) input.current.value = "";
  }
  return <section aria-label="Tải tệp lên" aria-busy={busy} className="space-y-3">
    <div className={`space-y-3 rounded-card border-2 border-dashed p-5 transition-colors motion-reduce:transition-none sm:p-6 ${dragging ? "border-primary bg-bg-tint" : "border-line/30 bg-bg-elevated"}`}
      onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
      onDrop={event => { event.preventDefault(); setDragging(false); void upload(Array.from(event.dataTransfer.files)); }}>
      <label htmlFor="media-upload" className="block font-semibold">Kéo thả tệp hoặc chọn nhiều tệp</label>
      <p id="media-upload-hint" className="text-sm text-fg-muted">Ảnh tối đa 15 MB, video 200 MB, PDF 20 MB. Tệp cần được kiểm tra trước khi sử dụng.</p>
      <input ref={input} id="media-upload" type="file" multiple disabled={busy} aria-describedby="media-upload-hint"
        className="block w-full min-w-0 text-sm text-fg-muted file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-button file:border-0 file:bg-primary file:px-4 file:font-semibold file:text-on-primary hover:file:bg-primary/90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg" onChange={event => void upload(Array.from(event.target.files ?? []))} />
    </div>
    <div aria-live="polite" aria-atomic="true"><ul className="space-y-2">{rows.map((row, i) => <li key={i} className={`break-words rounded-input border px-3 py-2 text-sm ${row.error ? "border-danger/30 bg-danger/10 text-danger" : "border-line/20 text-fg-muted"}`}><span translate="no" className="font-semibold text-fg">{row.name}</span>: {row.message}</li>)}</ul></div>
    <noscript><p className="text-fg-muted">Cần bật JavaScript để tải tệp lên. Bạn vẫn có thể tìm, xem và sửa các tệp hiện có.</p></noscript>
  </section>;
}
