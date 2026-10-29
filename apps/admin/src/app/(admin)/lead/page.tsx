import Link from "next/link";
import { forTenant, leadWeeklySources } from "@solar/db";
import { LEAD_SOURCE_LABELS, leadFromRow } from "@solar/leads";
import { getTenant, requirePageFeature, requirePagePermission } from "../../../lib/auth.ts";
import { getSiteEntitlements } from "../../../lib/entitlements.ts";
import { getRuntime } from "../../../lib/runtime.ts";
import { leadInboxDeps } from "../../../lib/leadInboxRuntime.ts";
import { leadStatuses, parseFilters, summarize, weeklyStats } from "../../../lib/leadInbox.ts";
import { ActionForm } from "../../../components/ActionForm.tsx";
import { LeadInboxLive } from "../../../components/LeadInboxLive.tsx";
import { updateLead, deleteLead, resendLead } from "./actions.ts";

const field = "min-h-11 w-full rounded-input border border-line/25 bg-bg px-3 py-2 text-fg focus-visible:ring-2 focus-visible:ring-primary";
const label = "block space-y-1 text-sm font-medium";
const sourceLabel = (source: string) => Object.hasOwn(LEAD_SOURCE_LABELS, source) ? LEAD_SOURCE_LABELS[source] : source;
const branchName = (title: unknown) => title && typeof title === "object" && "vi" in title && typeof title.vi === "string" ? title.vi : "—";
export default async function Leads({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requirePagePermission("leads.view");
  await requirePageFeature("leadInbox");
  const [{ tenantId }, can, query] = await Promise.all([getTenant(), getSiteEntitlements(), searchParams]);
  const params = new URLSearchParams(Object.entries(query).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  const filters = parseFilters(params), repo = forTenant(getRuntime().db, tenantId);
  const manage = session.permissions.has("leads.manage");
  // Read the watermark first: a lead arriving during list rendering must still trigger the next refresh.
  const latest = await leadInboxDeps.latest(tenantId);
  // Sequential on purpose: each call is its own tenant transaction holding a connection. In parallel, one page took the
  // whole admin pool (5) and starved login, layout and the 3 s live poll of other tabs (P2028).
  const page = await leadInboxDeps.list(tenantId, filters, { cursor: params.get("cursor") ?? undefined });
  const weekly = await leadWeeklySources(getRuntime().db, tenantId);
  const users = can("leadAssign") ? await repo.siteUser.list({ where: { role: { not: "client" } }, select: { id: true, name: true }, orderBy: { name: "asc" } }) : [];
  const branches = can("leadAssign") ? await repo.branch.list({ select: { id: true, title: true }, orderBy: { order: "asc" } }) : [];
  const sources = await repo.lead.list({ where: { status: { not: "spam" } }, distinct: ["source"], select: { source: true }, orderBy: { source: "asc" } });
  const stats = weeklyStats(weekly), csvParams = new URLSearchParams(params); csvParams.delete("cursor");
  const nextParams = new URLSearchParams(params); if (page.cursor) nextParams.set("cursor", page.cursor);
  return <section className="min-w-0 space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">Hộp thư lead</h1>
      {can("leadExport") && <a href={`/api/lead/csv?${csvParams}`} className="rounded-button border border-line/25 px-4 py-3">Xuất CSV</a>}</div>
    <LeadInboxLive latest={latest} />
    <form action="/lead" method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Lọc lead">
      <label className={label}>Trạng thái<select name="trang-thai" defaultValue={filters.status ?? ""} className={field}><option value="">Tất cả (trừ spam)</option>{Object.entries(leadStatuses).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>
      <label className={label}>Nguồn<select name="nguon" defaultValue={filters.source ?? ""} className={field}><option value="">Mọi nguồn</option>{sources.map(({ source }) => <option key={source} value={source}>{sourceLabel(source)}</option>)}</select></label>
      <label className={label}>Từ ngày<input name="tu" type="date" defaultValue={params.get("tu") ?? ""} className={field} /></label>
      <label className={label}>Đến ngày<input name="den" type="date" defaultValue={params.get("den") ?? ""} className={field} /></label>
      <label className={label}>Tên hoặc SĐT<input name="q" defaultValue={filters.q ?? ""} maxLength={120} className={field} /></label>
      <button className="min-h-11 rounded-button bg-primary px-4 py-2 text-on-primary">Lọc lead</button><Link className="px-4 py-3 underline" href="/lead">Xóa bộ lọc</Link>
    </form>
    {!page.rows.length && <p className="rounded-card border border-line/20 p-5 text-fg-muted">Chưa có lead phù hợp. Lead gửi từ website sẽ xuất hiện tại đây.</p>}
    <ul aria-label="Danh sách lead" className="space-y-4">
      {page.rows.map(row => { const info = summarize(row.data), detail = leadFromRow(row); return <li key={row.id} data-lead-id={row.id} className="min-w-0 rounded-card border border-line/20 bg-bg-elevated p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="break-words text-lg font-semibold">{row.name || "Chưa có tên"}</h2><a href={`tel:${row.phone}`} className="underline">{row.phone}</a></div>
          <span className="rounded-button bg-bg-tint px-3 py-1 text-sm">{leadStatuses[row.status]}</span></div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {[["Nguồn", sourceLabel(row.source)], ["Phân khúc", row.segment || "—"], ["Tỉnh/thành", info.province], ["Dự toán", info.estimate], ["Sản phẩm", info.items], ["Ngày nhận", row.createdAt.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })]].map(([name, value]) => <div key={name} className="min-w-0"><dt className="text-fg-muted">{name}</dt><dd className="break-words">{value}</dd></div>)}
        </dl>
        <details className="mt-4"><summary className="min-h-11 cursor-pointer py-2 font-medium">Chi tiết và chăm sóc lead</summary>
          <dl className="my-3 space-y-2 break-words text-sm"><div><dt>Email</dt><dd>{row.email || "—"}</dd></div><div><dt>Zalo</dt><dd>{detail.zalo || "—"}</dd></div><div><dt>Địa chỉ</dt><dd>{detail.address || "—"}</dd></div><div><dt>Loại hình kinh doanh</dt><dd>{detail.businessType || "—"}</dd></div><div><dt>Nhu cầu</dt><dd className="whitespace-pre-wrap">{row.message || "—"}</dd></div><div><dt>Đồng ý xử lý dữ liệu lúc</dt><dd>{info.consentAt}</dd></div>
            {can("leadAssign") && <><div><dt>Người phụ trách</dt><dd>{users.find(user => user.id === row.assigneeId)?.name || "—"}</dd></div><div><dt>Chi nhánh</dt><dd>{branchName(branches.find(branch => branch.id === row.branchId)?.title)}</dd></div></>}
          </dl>
          {manage ? <ActionForm action={updateLead} label="Lưu lead" permalink="/lead">
            <input type="hidden" name="id" value={row.id} />
            <label className={label}>Trạng thái<select name="status" defaultValue={row.status} className={field}>{Object.entries(leadStatuses).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>
            <label className={label}>Ghi chú<textarea name="note" rows={3} maxLength={2000} defaultValue={row.note ?? ""} className={field} /></label>
            {can("leadAssign") && <div className="grid gap-3 sm:grid-cols-2">
              <label className={label}>Người phụ trách<select name="assigneeId" defaultValue={row.assigneeId ?? ""} className={field}><option value="">Chưa phân công</option>{users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label>
              <label className={label}>Chi nhánh<select name="branchId" defaultValue={row.branchId ?? ""} className={field}><option value="">Chưa phân công</option>{branches.map(branch => <option key={branch.id} value={branch.id}>{branchName(branch.title)}</option>)}</select></label>
            </div>}
          </ActionForm> : <p className="whitespace-pre-wrap text-sm">Ghi chú: {row.note || "—"}</p>}
          <h3 className="mb-2 mt-5 font-medium">Trạng thái gửi kênh</h3>
          {!row.jobs.length && <p className="text-sm text-fg-muted">Không có kênh gửi cho lead này.</p>}
          <ul className="space-y-3">{row.jobs.map(job => <li key={job.id} className="flex flex-wrap items-center gap-3 text-sm"><span>{typeof job.payload === "object" && job.payload && "kind" in job.payload ? String(job.payload.kind) : "Kênh"}: {({ pending: "Chờ gửi", processing: "Đang gửi", done: "Đã gửi", failed: "Gửi thất bại" })[job.status]} · {job.attempts} lần</span>
            {manage && job.status === "failed" && <ActionForm action={resendLead} label="Gửi lại" permalink="/lead" secondary><input type="hidden" name="id" value={row.id} /><input type="hidden" name="jobId" value={job.id} /></ActionForm>}</li>)}</ul>
          {manage && <details className="mt-5"><summary className="cursor-pointer py-3 text-danger">Xóa lead theo yêu cầu</summary><p className="mb-3 text-sm">Xác nhận xóa thông tin lead và các lần gửi chưa hoàn tất. Thao tác này không thể hoàn tác.</p><ActionForm action={deleteLead} label="Xác nhận xóa lead" permalink="/lead" secondary><input type="hidden" name="id" value={row.id} /></ActionForm></details>}
        </details>
      </li>; })}
    </ul>
    {page.cursor && <Link href={`/lead?${nextParams}`} className="inline-block rounded-button border border-line/25 px-4 py-3">Trang tiếp</Link>}
    <section aria-labelledby="lead-stats" className="space-y-3"><h2 id="lead-stats" className="text-lg font-semibold">Thống kê nguồn theo tuần</h2><p className="text-sm text-fg-muted">8 tuần gần nhất, múi giờ Việt Nam.</p>
      {!stats.rows.length ? <p className="text-sm">Chưa có dữ liệu thống kê.</p> : <div className="max-w-full overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Số lead theo nguồn và tuần bắt đầu vào thứ Hai</caption><thead><tr><th scope="col" className="p-2">Nguồn</th>{stats.weeks.map(week => <th scope="col" key={week} className="p-2">{week}</th>)}<th scope="col" className="p-2">Tổng</th></tr></thead><tbody>{stats.rows.map(row => <tr key={row.source}><th scope="row" className="p-2">{sourceLabel(row.source)}</th>{row.counts.map((count, i) => <td className="p-2" key={stats.weeks[i]}>{count}</td>)}<td className="p-2">{row.total}</td></tr>)}</tbody></table></div>}
    </section>
  </section>;
}
