import Link from "next/link";
import { forTenant, mediaReferences } from "@solar/db";
import { getTenant, requirePagePermission } from "../../../lib/auth.ts";
import { getRuntime } from "../../../lib/runtime.ts";
import { listMedia, filterMedia, mediaStatus, mediaAlt, altWarning } from "../../../lib/mediaLibrary.ts";
import { MediaUpload } from "../../../components/MediaUpload.tsx";

export default async function Media({ searchParams }: { searchParams: Promise<{ q?: string; loai?: string }> }) {
  const session = await requirePagePermission("media.view"), { tenantId } = await getTenant(), db = getRuntime().db;
  const params = await searchParams, q = typeof params.q === "string" ? params.q : "", kind = typeof params.loai === "string" ? params.loai : "";
  const all = await listMedia(db, tenantId), rows = filterMedia(all, { q, kind });
  const uses = rows.length ? await mediaReferences(forTenant(db, tenantId), rows.map(row => row.id)) : new Map();
  const field = "h-11 w-full rounded-input border border-line/25 bg-bg-elevated px-3 text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
  return <section className="space-y-6">
    <header className="space-y-1">
      <h1 className="text-2xl font-semibold text-fg">Media</h1>
      <p className="text-fg-muted">Thư viện 200 tệp tải lên gần nhất. Tải lại trang để xem trạng thái xử lý mới.</p>
    </header>
    {session.permissions.has("media.manage") ? <MediaUpload /> : null}
    <form method="get" role="search" className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-end">
      <div className="space-y-1"><label htmlFor="media-q" className="block text-sm font-semibold">Tìm tên hoặc alt</label>
        <input id="media-q" type="search" name="q" defaultValue={q} autoComplete="off" spellCheck={false} placeholder="Ví dụ: mái nhà…" className={field} /></div>
      <div className="space-y-1"><label htmlFor="media-kind" className="block text-sm font-semibold">Loại tệp</label>
        <select id="media-kind" name="loai" defaultValue={["image", "video", "document"].includes(kind) ? kind : ""} className={field}>
          <option value="">Tất cả</option><option value="image">Ảnh</option><option value="video">Video</option><option value="document">Tài liệu PDF</option>
        </select></div>
      <button className="h-11 rounded-button bg-primary px-5 font-semibold text-on-primary hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg">Tìm và lọc</button>
    </form>
    {all.length > 0 ? <p className="text-sm text-fg-muted tabular-nums" aria-live="polite">{rows.length === all.length ? `${all.length} tệp` : `${rows.length} / ${all.length} tệp khớp`}</p> : null}
    {all.length === 0 ? <p className="rounded-card border border-dashed border-line/30 p-8 text-center text-fg-muted">Chưa có tệp nào được tải lên.</p>
      : rows.length === 0 ? <p className="rounded-card border border-dashed border-line/30 p-8 text-center text-fg-muted">Không có tệp khớp tìm kiếm. Hãy đổi từ khóa hoặc loại tệp.</p>
      : <ul aria-label="Thư viện media" className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">{rows.map(row => {
        const count = uses.get(row.id)?.length ?? 0;
        return <li key={row.id} data-media-id={row.id} className="min-w-0 overflow-hidden rounded-card border border-line/20 bg-bg-elevated transition-colors hover:border-primary/40 motion-reduce:transition-none">
          <Link href={`/media/${row.id}`} className="flex h-full flex-col text-fg no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
            {row.mime.startsWith("image/") && row.status === "ready" ?
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={`/api/media/${row.id}`} alt={mediaAlt(row.alt).vi} width={row.width ?? 320} height={row.height ?? 240} loading="lazy" className="aspect-[4/3] w-full bg-bg-tint object-cover" />
              : <div aria-hidden="true" className="flex aspect-[4/3] items-center justify-center bg-bg-tint text-sm font-semibold text-fg-muted">{row.status === "quarantine" ? "Đang xử lý…" : row.mime.startsWith("video/") ? "▶ Video" : row.mime === "application/pdf" ? "PDF" : "Ảnh"}</div>}
            <span className="flex flex-1 flex-col gap-2 p-3">
              <span className="line-clamp-2 break-all text-sm font-semibold" translate="no" title={row.name || row.id}>{row.name || row.id}</span>
              <span className="text-xs text-fg-muted tabular-nums">{row.mime} · {new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(row.size / 1024)} KB</span>
              <span className="mt-auto flex flex-wrap gap-1.5 pt-1 text-xs">
                <span className={`rounded-pill px-2 py-0.5 ${row.status === "failed" ? "bg-danger/10 text-danger" : row.status === "ready" ? "bg-success/10 text-success" : "bg-bg-tint text-fg-muted"}`}>{mediaStatus(row)}</span>
                {altWarning(row) ? <span className="rounded-pill bg-danger/10 px-2 py-0.5 font-semibold text-danger">Thiếu alt (SEO)</span> : null}
                <span className="rounded-pill bg-bg-tint px-2 py-0.5 text-fg-muted tabular-nums">{count} chỗ dùng</span>
              </span>
            </span>
          </Link>
        </li>;
      })}</ul>}
  </section>;
}
