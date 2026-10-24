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
  return <section className="space-y-6">
    <h1 className="text-2xl font-semibold text-fg">Media</h1>
    <p className="text-fg-muted">Thư viện 200 tệp tải lên gần nhất. Tải lại trang để xem trạng thái xử lý mới.</p>
    {session.permissions.has("media.manage") ? <MediaUpload /> : null}
    <form method="get" className="flex flex-wrap items-end gap-3">
      <label className="min-w-0 flex-1 space-y-1"><span className="block">Tìm tên hoặc alt</span><input type="search" name="q" defaultValue={q} className="w-full rounded-input border border-line/25 bg-bg-elevated px-3 py-2" /></label>
      <label className="space-y-1"><span className="block">Loại tệp</span><select name="loai" defaultValue={["image", "video", "document"].includes(kind) ? kind : ""} className="rounded-input border border-line/25 bg-bg-elevated px-3 py-2">
        <option value="">Tất cả</option><option value="image">Ảnh</option><option value="video">Video</option><option value="document">Tài liệu PDF</option>
      </select></label>
      <button className="rounded-button bg-primary px-4 py-2 font-semibold text-on-primary">Tìm và lọc</button>
    </form>
    {all.length === 0 ? <p>Chưa có tệp nào được tải lên.</p> : rows.length === 0 ? <p>Không có tệp khớp tìm kiếm. Hãy đổi từ khóa hoặc loại tệp.</p> : <ul aria-label="Thư viện media" className="grid grid-cols-2 gap-4 lg:grid-cols-4">{rows.map(row => <li key={row.id} data-media-id={row.id} className="min-w-0 overflow-hidden rounded-card border border-line/20 bg-bg-elevated">
      <Link href={`/media/${row.id}`} className="block h-full space-y-3 p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
        {row.mime.startsWith("image/") && row.status === "ready" ?
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={`/api/media/${row.id}`} alt={mediaAlt(row.alt).vi} width={row.width ?? 320} height={row.height ?? 240} loading="lazy" className="aspect-[4/3] w-full rounded-card bg-bg-tint object-cover" />
          : <div aria-hidden="true" className="flex aspect-[4/3] items-center justify-center rounded-card bg-bg-tint text-fg-muted">{row.status === "quarantine" ? "Đang xử lý" : row.mime.startsWith("video/") ? "▶ Video" : row.mime === "application/pdf" ? "▤ PDF" : "▧ Ảnh"}</div>}
        <span className="block break-words font-semibold">{row.name || row.id}</span>
        <span className="block text-sm text-fg-muted">{row.mime} · {new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(row.size / 1024)} KB</span>
        <span className="inline-block rounded-button bg-bg-tint px-2 py-1 text-sm">{mediaStatus(row)}</span>
        {altWarning(row) ? <span className="block text-sm font-semibold text-danger">Thiếu alt (SEO)</span> : null}
        <span className="block text-sm text-fg-muted">{uses.get(row.id)?.length ?? 0} chỗ dùng</span>
      </Link>
    </li>)}</ul>}
  </section>;
}
