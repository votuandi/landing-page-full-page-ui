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

const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg";
const field = "min-h-11 w-full rounded-input border border-line/25 bg-bg px-3 py-2 text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
const label = "block space-y-1 text-sm font-medium";
const pill = "inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-semibold";
// Status colour carries meaning only together with its text label (never colour alone).
const statusTone: Record<string, string> = {
  new: "bg-primary/10 text-primary", contacted: "bg-bg-tint text-fg", quoted: "bg-primary/10 text-primary",
  won: "bg-success/10 text-success", lost: "bg-danger/10 text-danger", spam: "bg-bg-tint text-fg-muted",
};
const jobStatus = { pending: "Chờ gửi", processing: "Đang gửi", done: "Đã gửi", failed: "Gửi thất bại" } as const;
const jobTone = { pending: "bg-bg-tint text-fg-muted", processing: "bg-bg-tint text-fg-muted", done: "bg-success/10 text-success", failed: "bg-danger/10 text-danger" } as const;
const channelNames: Record<string, string> = { email: "Email", telegram: "Telegram", webhook: "Webhook", google_sheets: "Google Sheets" };
const vnTime = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short" });
};
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
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-1"><h1 className="text-2xl font-semibold text-fg">Hộp thư lead</h1>
        <LeadInboxLive latest={latest} /></div>
      {can("leadExport") && <a href={`/api/lead/csv?${csvParams}`} className={`inline-flex min-h-11 items-center rounded-button border border-line/25 bg-bg-elevated px-4 font-semibold text-fg no-underline hover:bg-bg-tint ${ring}`}>Xuất CSV</a>}
    </header>
    <form action="/lead" method="get" className="grid gap-3 rounded-card border border-line/20 bg-bg-elevated p-4 sm:grid-cols-2 lg:grid-cols-5" aria-label="Lọc lead">
      <label className={label}>Trạng thái<select name="trang-thai" defaultValue={filters.status ?? ""} className={field}><option value="">Tất cả (trừ spam)</option>{Object.entries(leadStatuses).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>
      <label className={label}>Nguồn<select name="nguon" defaultValue={filters.source ?? ""} className={field}><option value="">Mọi nguồn</option>{sources.map(({ source }) => <option key={source} value={source}>{sourceLabel(source)}</option>)}</select></label>
      <label className={label}>Từ ngày<input name="tu" type="date" defaultValue={params.get("tu") ?? ""} className={field} /></label>
      <label className={label}>Đến ngày<input name="den" type="date" defaultValue={params.get("den") ?? ""} className={field} /></label>
      <label className={label}>Tên hoặc SĐT<input name="q" type="search" defaultValue={filters.q ?? ""} maxLength={120} autoComplete="off" spellCheck={false} placeholder="Ví dụ: 0901…" className={field} /></label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-5">
        <button className={`min-h-11 rounded-button bg-primary px-5 font-semibold text-on-primary hover:bg-primary/90 ${ring}`}>Lọc lead</button>
        <Link className={`inline-flex min-h-11 items-center rounded-button px-3 text-fg-muted underline hover:text-fg ${ring}`} href="/lead">Xóa bộ lọc</Link>
      </div>
    </form>
    {!page.rows.length && <p className="rounded-card border border-dashed border-line/30 p-8 text-center text-fg-muted">Chưa có lead phù hợp. Lead gửi từ website sẽ xuất hiện tại đây.</p>}
    <ul aria-label="Danh sách lead" className="space-y-3">
      {page.rows.map(row => { const info = summarize(row.data), detail = leadFromRow(row); return <li key={row.id} data-lead-id={row.id} className="min-w-0 rounded-card border border-line/20 bg-bg-elevated p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0"><h2 className="break-words text-lg font-semibold text-fg">{row.name || "Chưa có tên"}</h2>
            <a href={`tel:${row.phone}`} className={`rounded-button font-medium tabular-nums text-primary underline ${ring}`} translate="no">{row.phone}</a></div>
          <span className={`${pill} ${statusTone[row.status] ?? statusTone.spam}`}>{leadStatuses[row.status]}</span></div>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:gap-x-6 lg:grid-cols-3">
          {[["Nguồn", sourceLabel(row.source)], ["Phân khúc", row.segment || "—"], ["Tỉnh/thành", info.province], ["Dự toán", info.estimate], ["Sản phẩm", info.items], ["Ngày nhận", vnTime(row.createdAt)]].map(([name, value]) => <div key={name} className="min-w-0"><dt className="text-fg-muted">{name}</dt><dd className="break-words text-fg">{value}</dd></div>)}
        </dl>
        <details className="group mt-4 border-t border-line/15 pt-2"><summary className={`min-h-11 cursor-pointer rounded-button py-2.5 font-semibold text-fg ${ring}`}>Chi tiết và chăm sóc lead</summary>
          <dl className="my-3 grid gap-x-6 gap-y-3 break-words text-sm sm:grid-cols-2">
            {[["Email", row.email || "—"], ["Zalo", detail.zalo || "—"], ["Địa chỉ", detail.address || "—"], ["Loại hình kinh doanh", detail.businessType || "—"]].map(([name, value]) => <div key={name} className="min-w-0"><dt className="text-fg-muted">{name}</dt><dd className="text-fg">{value}</dd></div>)}
            <div className="min-w-0 sm:col-span-2"><dt className="text-fg-muted">Nhu cầu</dt><dd className="whitespace-pre-wrap text-fg">{row.message || "—"}</dd></div>
            <div className="min-w-0"><dt className="text-fg-muted">Đồng ý xử lý dữ liệu lúc</dt><dd className="tabular-nums text-fg">{info.consentAt === "—" ? "—" : vnTime(info.consentAt)}</dd></div>
            {can("leadAssign") && <><div className="min-w-0"><dt className="text-fg-muted">Người phụ trách</dt><dd className="text-fg">{users.find(user => user.id === row.assigneeId)?.name || "—"}</dd></div><div className="min-w-0"><dt className="text-fg-muted">Chi nhánh</dt><dd className="text-fg">{branchName(branches.find(branch => branch.id === row.branchId)?.title)}</dd></div></>}
          </dl>
          {manage ? <div className="max-w-2xl"><ActionForm action={updateLead} label="Lưu lead" permalink="/lead">
            <input type="hidden" name="id" value={row.id} />
            <label className={label}>Trạng thái<select name="status" defaultValue={row.status} className={field}>{Object.entries(leadStatuses).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>
            <label className={label}>Ghi chú<textarea name="note" rows={3} maxLength={2000} defaultValue={row.note ?? ""} className={field} /></label>
            {can("leadAssign") && <div className="grid gap-3 sm:grid-cols-2">
              <label className={label}>Người phụ trách<select name="assigneeId" defaultValue={row.assigneeId ?? ""} className={field}><option value="">Chưa phân công</option>{users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label>
              <label className={label}>Chi nhánh<select name="branchId" defaultValue={row.branchId ?? ""} className={field}><option value="">Chưa phân công</option>{branches.map(branch => <option key={branch.id} value={branch.id}>{branchName(branch.title)}</option>)}</select></label>
            </div>}
          </ActionForm></div> : <p className="whitespace-pre-wrap text-sm"><span className="text-fg-muted">Ghi chú: </span>{row.note || "—"}</p>}
          <h3 className="mb-2 mt-6 text-sm font-semibold text-fg">Trạng thái gửi kênh</h3>
          {!row.jobs.length && <p className="text-sm text-fg-muted">Không có kênh gửi cho lead này.</p>}
          <ul className="divide-y divide-line/15 rounded-card border border-line/15">{row.jobs.map(job => { const kind = typeof job.payload === "object" && job.payload && "kind" in job.payload ? String(job.payload.kind) : ""; return <li key={job.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 text-sm">
            <span className="flex flex-wrap items-center gap-2"><span className="font-medium text-fg">{channelNames[kind] ?? (kind || "Kênh")}</span><span className={`${pill} ${jobTone[job.status]}`}>{jobStatus[job.status]}</span><span className="tabular-nums text-fg-muted">{job.attempts} lần</span></span>
            {manage && job.status === "failed" && <ActionForm action={resendLead} label="Gửi lại" permalink="/lead" secondary><input type="hidden" name="id" value={row.id} /><input type="hidden" name="jobId" value={job.id} /></ActionForm>}</li>; })}</ul>
          {manage && <details className="mt-6 rounded-card border border-danger/30 p-3"><summary className={`min-h-11 cursor-pointer rounded-button py-2.5 font-semibold text-danger ${ring}`}>Xóa lead theo yêu cầu</summary><p className="mb-3 text-sm text-fg-muted">Xác nhận xóa thông tin lead và các lần gửi chưa hoàn tất. Thao tác này không thể hoàn tác.</p><div className="max-w-xs"><ActionForm action={deleteLead} label="Xác nhận xóa lead" permalink="/lead" secondary><input type="hidden" name="id" value={row.id} /></ActionForm></div></details>}
        </details>
      </li>; })}
    </ul>
    {page.cursor && <Link href={`/lead?${nextParams}`} className={`inline-flex min-h-11 items-center rounded-button border border-line/25 px-4 font-semibold text-fg no-underline hover:bg-bg-tint ${ring}`}>Trang tiếp</Link>}
    <section aria-labelledby="lead-stats" className="space-y-3"><div><h2 id="lead-stats" className="text-lg font-semibold text-fg">Thống kê nguồn theo tuần</h2><p className="text-sm text-fg-muted">8 tuần gần nhất, múi giờ Việt Nam.</p></div>
      {!stats.rows.length ? <p className="text-sm text-fg-muted">Chưa có dữ liệu thống kê.</p> : <div className="max-w-full overflow-x-auto rounded-card border border-line/20 bg-bg-elevated"><table className="w-full text-left text-sm tabular-nums"><caption className="sr-only">Số lead theo nguồn và tuần bắt đầu vào thứ Hai</caption><thead className="border-b border-line/20 text-fg-muted"><tr><th scope="col" className="whitespace-nowrap px-3 py-2 font-semibold">Nguồn</th>{stats.weeks.map(week => <th scope="col" key={week} className="whitespace-nowrap px-3 py-2 text-right font-semibold">{week}</th>)}<th scope="col" className="px-3 py-2 text-right font-semibold">Tổng</th></tr></thead><tbody className="divide-y divide-line/10">{stats.rows.map(row => <tr key={row.source}><th scope="row" className="whitespace-nowrap px-3 py-2 font-medium text-fg">{sourceLabel(row.source)}</th>{row.counts.map((count, i) => <td className="px-3 py-2 text-right" key={stats.weeks[i]}>{count}</td>)}<td className="px-3 py-2 text-right font-semibold">{row.total}</td></tr>)}</tbody></table></div>}
    </section>
  </section>;
}
