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
    <div className={`space-y-3 rounded-card border border-dashed p-5 ${dragging ? "border-primary bg-bg-tint" : "border-line/40 bg-bg-elevated"}`}
      onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
      onDrop={event => { event.preventDefault(); setDragging(false); void upload(Array.from(event.dataTransfer.files)); }}>
      <label htmlFor="media-upload" className="block font-semibold">Kéo thả tệp hoặc chọn nhiều tệp</label>
      <p id="media-upload-hint" className="text-sm text-fg-muted">Ảnh tối đa 15 MB, video 200 MB, PDF 20 MB. Tệp cần được kiểm tra trước khi sử dụng.</p>
      <input ref={input} id="media-upload" type="file" multiple disabled={busy} aria-describedby="media-upload-hint"
        className="block w-full min-w-0 text-sm focus-visible:outline-primary" onChange={event => void upload(Array.from(event.target.files ?? []))} />
    </div>
    <div aria-live="polite" aria-atomic="true"><ul className="space-y-2">{rows.map((row, i) => <li key={i} className={`break-words text-sm ${row.error ? "text-danger" : "text-fg-muted"}`}>{row.name}: {row.message}</li>)}</ul></div>
    <noscript><p className="text-fg-muted">Cần bật JavaScript để tải tệp lên. Bạn vẫn có thể tìm, xem và sửa các tệp hiện có.</p></noscript>
  </section>;
}
