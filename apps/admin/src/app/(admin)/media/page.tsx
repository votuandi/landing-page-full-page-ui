import { getTenant, requirePagePermission } from "../../../lib/auth.ts";
import { getRuntime } from "../../../lib/runtime.ts";
import { listMedia, mediaStatus } from "../../../lib/mediaLibrary.ts";

export default async function Media() {
  await requirePagePermission("media.view");
  const rows = await listMedia(getRuntime().db, (await getTenant()).tenantId);
  return <section className="space-y-6">
    <h1 className="text-2xl font-semibold text-fg">Media</h1>
    <p className="text-fg-muted">Trạng thái của 50 tệp tải lên gần nhất. Tải lại trang để xem trạng thái mới.</p>
    {rows.length === 0 ? <p>Chưa có tệp nào được tải lên.</p> : <div role="region" aria-label="Tệp tải lên gần đây" tabIndex={0} className="min-w-0 overflow-x-auto rounded-card border border-line/20 bg-bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
      <table className="w-full text-left text-sm">
        <caption className="p-4 text-left font-semibold">Tệp tải lên gần đây</caption>
        <thead><tr className="border-b border-line/20">
          {["Tệp", "Loại", "Dung lượng", "Trạng thái", "Ngày tải lên"].map(label => <th key={label} scope="col" className="p-4 font-semibold">{label}</th>)}
        </tr></thead>
        <tbody>{rows.map(row => <tr key={row.id} className="border-b border-line/20 last:border-0">
          <th scope="row" className="max-w-40 break-all p-4 font-normal" translate="no">{row.id}</th>
          <td className="p-4">{row.mime}</td>
          <td className="whitespace-nowrap p-4 tabular-nums">{new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(row.size / 1024)} KB</td>
          <td className="p-4">{mediaStatus(row)}</td>
          <td className="p-4"><time dateTime={row.createdAt.toISOString()}>{new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(row.createdAt)}</time></td>
        </tr>)}</tbody>
      </table>
    </div>}
  </section>;
}
