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
  return <section className="space-y-6">
    <Link href="/media" className="text-primary underline">Thư viện media</Link>
    <h1 className="break-words text-2xl font-semibold">{row.name || row.id}</h1>
    <p className="text-fg-muted">{mediaStatus(row)} · {row.mime} · {new Intl.NumberFormat("vi-VN").format(row.size)} byte{row.width && row.height ? ` · ${row.width} × ${row.height}` : ""}</p>
    {altWarning(row) ? <p role="status" className="text-danger">Thiếu alt (SEO). Thêm mô tả ảnh để hỗ trợ công cụ tìm kiếm và trình đọc màn hình.</p> : null}
    {ready && image ?
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src={`/api/media/${id}`} alt={alt.vi} width={row.width ?? 640} height={row.height ?? 480} className="max-h-96 w-full rounded-card bg-bg-tint object-contain" />
      : ready ? <a href={`/api/media/${id}`} className="text-primary underline">Mở {row.mime.startsWith("video/") ? "video" : "tài liệu PDF"}</a> : <p>Tệp chưa sẵn sàng để xem trước.</p>}
    <section className="space-y-4"><h2 className="text-xl font-semibold">Thông tin media</h2>
      {manage ? <ActionForm action={saveMedia} label="Lưu thông tin" permalink={permalink}>
        <input type="hidden" name="id" value={id} />
        <label className="block space-y-1"><span className="block">Alt tiếng Việt</span><input name="vi" defaultValue={alt.vi} required={image} maxLength={250} className="w-full rounded-input border border-line/25 bg-bg-elevated px-3 py-2" /></label>
        <label className="block space-y-1"><span className="block">Alt tiếng Anh</span><input name="en" defaultValue={alt.en} maxLength={250} className="w-full rounded-input border border-line/25 bg-bg-elevated px-3 py-2" /></label>
        {ready && image ? <FocalPicker key={`${id}:${focal.x}:${focal.y}`} src={`/api/media/${id}`} width={row.width ?? 640} height={row.height ?? 480} initial={focal} /> : null}
      </ActionForm> : <dl className="space-y-2"><dt>Alt tiếng Việt</dt><dd>{alt.vi || "Chưa có mô tả"}</dd><dt>Alt tiếng Anh</dt><dd>{alt.en || "Chưa có mô tả"}</dd><dt>Điểm lấy nét</dt><dd>{focal.x}, {focal.y}</dd></dl>}
    </section>
    <section className="space-y-3"><h2 className="text-xl font-semibold">Nơi đang dùng ({uses.length})</h2>
      {uses.length ? <ul className="list-inside list-disc space-y-2">{uses.map((use, index) => <li key={index}><Link href={use.href} className="text-primary underline">{use.label}</Link></li>)}</ul> : <p className="text-fg-muted">Media chưa được sử dụng.</p>}
    </section>
    {manage && row.status !== "quarantine" ? <section className="space-y-3 rounded-card border border-danger/30 p-4"><h2 className="text-xl font-semibold">Xóa media</h2>
      <p>Xóa tệp khỏi thư viện và kho lưu trữ. Thao tác này không thể hoàn tác.</p>
      {uses.length ? <p id="delete-media-warning" className="text-danger">Các chỗ được liệt kê ở trên sẽ mất ảnh, cần chọn ảnh khác. Liên kết trong nội dung vẫn được giữ để bạn thay ảnh.</p> : null}
      <ActionForm action={removeMedia} label="Xóa media" permalink={permalink} secondary>
        <input type="hidden" name="id" value={id} />
        <label className="flex items-start gap-2"><input type="checkbox" name="confirm" required aria-describedby={uses.length ? "delete-media-warning" : undefined} className="mt-1 h-5 w-5 accent-primary" /><span>Tôi hiểu và xác nhận xóa media{uses.length ? " đang được sử dụng" : " này"}.</span></label>
      </ActionForm>
    </section> : null}
  </section>;
}
