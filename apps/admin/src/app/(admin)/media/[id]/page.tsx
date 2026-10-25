import Link from "next/link";
import { notFound } from "next/navigation";
import { forTenant, mediaReferences, mediaFocalSchema } from "@solar/db";
import { getTenant, requirePagePermission } from "../../../../lib/auth.ts";
import { getRuntime } from "../../../../lib/runtime.ts";
import { mediaAlt, altWarning, mediaStatus } from "../../../../lib/mediaLibrary.ts";
import { ActionForm } from "../../../../components/ActionForm.tsx";
import { FocalPicker } from "../../../../components/FocalPicker.tsx";
import { saveMedia, removeMedia } from "../actions.ts";

export default async function MediaDetail({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePagePermission("media.view"), { tenantId } = await getTenant(), { id } = await params;
  const repo = forTenant(getRuntime().db, tenantId), row = await repo.media.get(id);
  if (!row) notFound();
  const uses = (await mediaReferences(repo, [id])).get(id) ?? [], alt = mediaAlt(row.alt);
  const focal = mediaFocalSchema.safeParse(row.focal).data ?? { x: 0.5, y: 0.5 };
  const image = row.mime.startsWith("image/"), ready = row.status === "ready", manage = session.permissions.has("media.manage");
  const permalink = `/media/${id}`;
  const card = "space-y-4 rounded-card border border-line/20 bg-bg-elevated p-4 sm:p-5";
  const field = "w-full rounded-input border border-line/25 bg-bg px-3 py-2 text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
  const picker = manage && ready && image;
  return <section className="space-y-6">
    <Link href="/media" className="inline-flex min-h-11 items-center text-sm">← Thư viện media</Link>
    <header className="space-y-2">
      <h1 className="break-all text-2xl font-semibold" translate="no">{row.name || row.id}</h1>
      <p className="text-sm text-fg-muted tabular-nums">{mediaStatus(row)} · {row.mime} · {new Intl.NumberFormat("vi-VN").format(row.size)} byte{row.width && row.height ? ` · ${row.width} × ${row.height}` : ""}</p>
    </header>
    {altWarning(row) ? <p role="status" className="rounded-card border border-danger/30 bg-danger/10 px-4 py-3 text-danger">Thiếu alt (SEO). Thêm mô tả ảnh để hỗ trợ công cụ tìm kiếm và trình đọc màn hình.</p> : null}
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
    <div className="min-w-0 space-y-6">
    {picker ? null : ready && image ?
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src={`/api/media/${id}`} alt={alt.vi} width={row.width ?? 640} height={row.height ?? 480} className="max-h-96 w-full rounded-card border border-line/20 bg-bg-tint object-contain" />
      : ready ? <a href={`/api/media/${id}`} className="inline-flex min-h-11 items-center">Mở {row.mime.startsWith("video/") ? "video" : "tài liệu PDF"}</a> : <p className="rounded-card bg-bg-tint p-6 text-center text-fg-muted">Tệp chưa sẵn sàng để xem trước.</p>}
    <section className={card}><h2 className="text-lg font-semibold">Thông tin media</h2>
      {manage ? <ActionForm action={saveMedia} label="Lưu thông tin" permalink={permalink}>
        <input type="hidden" name="id" value={id} />
        <label className="block space-y-1"><span className="block">Alt tiếng Việt</span><input name="vi" defaultValue={alt.vi} required={image} maxLength={250} className={field} /></label>
        <label className="block space-y-1"><span className="block">Alt tiếng Anh</span><input name="en" defaultValue={alt.en} maxLength={250} className={field} /></label>
        {ready && image ? <FocalPicker key={`${id}:${focal.x}:${focal.y}`} src={`/api/media/${id}`} width={row.width ?? 640} height={row.height ?? 480} initial={focal} /> : null}
      </ActionForm> : <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-[auto_minmax(0,1fr)]"><dt className="font-semibold">Alt tiếng Việt</dt><dd className="text-fg-muted">{alt.vi || "Chưa có mô tả"}</dd><dt className="font-semibold">Alt tiếng Anh</dt><dd className="text-fg-muted">{alt.en || "Chưa có mô tả"}</dd><dt className="font-semibold">Điểm lấy nét</dt><dd className="text-fg-muted tabular-nums">{focal.x}, {focal.y}</dd></dl>}
    </section>
    </div>
    <div className="min-w-0 space-y-6">
    <section className={card}><h2 className="text-lg font-semibold">Nơi đang dùng ({uses.length})</h2>
      {uses.length ? <ul className="divide-y divide-line/20">{uses.map((use, index) => <li key={index}><Link href={use.href} className="flex min-h-11 items-center break-words py-2">{use.label}</Link></li>)}</ul> : <p className="text-fg-muted">Media chưa được sử dụng.</p>}
    </section>
    {manage && row.status !== "quarantine" ? <section className="space-y-3 rounded-card border border-danger/30 bg-bg-elevated p-4 sm:p-5"><h2 className="text-lg font-semibold text-danger">Xóa media</h2>
      <p className="text-sm">Xóa tệp khỏi thư viện và kho lưu trữ. Thao tác này không thể hoàn tác.</p>
      {uses.length ? <p id="delete-media-warning" className="rounded-input bg-danger/10 px-3 py-2 text-sm text-danger">Các chỗ được liệt kê ở trên sẽ mất ảnh, cần chọn ảnh khác. Liên kết trong nội dung vẫn được giữ để bạn thay ảnh.</p> : null}
      <ActionForm action={removeMedia} label="Xóa media" permalink={permalink} secondary>
        <input type="hidden" name="id" value={id} />
        <label className="flex items-start gap-2"><input type="checkbox" name="confirm" required aria-describedby={uses.length ? "delete-media-warning" : undefined} className="mt-1 h-5 w-5 accent-primary" /><span>Tôi hiểu và xác nhận xóa media{uses.length ? " đang được sử dụng" : " này"}.</span></label>
      </ActionForm>
    </section> : null}
    </div>
    </div>
  </section>;
}
