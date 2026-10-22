import Link from "next/link";
import type { ReactNode } from "react";
import { getTenant, requirePagePermission } from "../../lib/auth.ts";
import { loadDashboard } from "../../lib/dashboard.ts";
import { createDashboardDeps } from "../../lib/dashboardRuntime.ts";
import { getSiteEntitlements } from "../../lib/entitlements.ts";
import { adminNav } from "../../lib/nav.ts";
import { getRuntime } from "../../lib/runtime.ts";

function Tile({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return <section aria-labelledby={id} className="min-w-0 space-y-4 rounded-card border border-line/20 bg-bg-elevated p-5">
    <h2 id={id} className="text-lg font-semibold text-fg">{title}</h2>
    {children}
  </section>;
}
const linkClass = "inline-flex min-h-11 min-w-0 items-center rounded-button [overflow-wrap:anywhere] text-primary underline underline-offset-4 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export default async function Dashboard() {
  const session = await requirePagePermission("dashboard.view");
  const tenant = await getTenant(), runtime = getRuntime();
  const [data, can] = await Promise.all([
    loadDashboard(session, createDashboardDeps(runtime.db, tenant, runtime.platform)),
    getSiteEntitlements(),
  ]);
  const links = new Set(adminNav({ permissions: session.permissions, can }).flatMap(group => group.items.map(item => item.href)));
  return <div className="space-y-6">
    <header><h1 className="text-2xl font-semibold text-fg">Tổng quan</h1><p className="mt-2 text-fg-muted">Tình hình site và những việc cần làm hôm nay. Số liệu theo giờ Việt Nam.</p></header>
    <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {data.leads ? <Tile id="dashboard-leads" title="Lead">
        <dl className="space-y-3">{[["Hôm nay", data.leads.today], ["7 ngày", data.leads.week], ["Chưa xử lý quá 24 giờ", data.leads.stale]].map(([label, count]) =>
          <div key={label}><dt className="text-fg-muted">{label}</dt><dd className="text-2xl font-semibold tabular-nums text-fg">{count}</dd></div>)}</dl>
        {data.leads.stale > 0 ? <p className="font-medium text-fg">Cần xử lý: {data.leads.stale} lead đã chờ quá 24 giờ.</p> : null}
        {data.leads.sources.length ? <dl className="space-y-2">{data.leads.sources.map(row => <div key={row.source} className="flex min-w-0 items-start justify-between gap-3">
          <dt className="min-w-0 [overflow-wrap:anywhere] text-fg-muted">{row.source}</dt><dd className="shrink-0 tabular-nums text-fg">{row.count}</dd>
        </div>)}</dl> : <p className="text-fg-muted">Chưa có lead trong 7 ngày.</p>}
        {links.has("/lead") ? <Link className={linkClass} href="/lead">Xem lead</Link> : null}
      </Tile> : null}
      {data.content ? <>
        <Tile id="dashboard-samples" title="Nội dung mẫu">
          {data.content.samples.length ? <ul className="space-y-2">{data.content.samples.map(page => <li key={page.id} className="min-w-0 break-words">
            <Link className={linkClass} href={page.href}>{page.title}</Link><p className="text-fg-muted">{page.sectionCount} section còn dữ liệu mẫu</p>
          </li>)}</ul> : <p className="text-fg-muted">Không còn section chứa dữ liệu mẫu.</p>}
        </Tile>
        <Tile id="dashboard-drafts" title="Bản nháp">
          {data.content.drafts.length ? <ul className="space-y-2">{data.content.drafts.map(page => <li key={page.id} className="min-w-0 break-words">
            <Link className={linkClass} href={page.href}>{page.title}</Link>
          </li>)}</ul> : <p className="text-fg-muted">Không có bản nháp chưa xuất bản.</p>}
        </Tile>
      </> : null}
      {data.media ? <Tile id="dashboard-media" title="Media">
        <dl><dt className="text-fg-muted">Dung lượng đã dùng / giới hạn gói</dt><dd className="text-2xl font-semibold tabular-nums text-fg">{data.media.label}</dd></dl>
        <p className="text-fg-muted">{data.media.percent.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}% dung lượng gói</p>
        {data.media.bytes === 0 ? <p className="text-fg-muted">Chưa có media.</p> : null}
        {data.media.warning ? <p className="font-medium text-fg">Cảnh báo: dung lượng media sắp đầy hoặc đã vượt giới hạn.</p> : null}
        {links.has("/media") ? <Link className={linkClass} href="/media">Mở thư viện media</Link> : null}
      </Tile> : null}
      {data.domain ? <Tile id="dashboard-domain" title="Tên miền">
        <dl><dt className="text-fg-muted">Tên miền chính</dt><dd className="[overflow-wrap:anywhere] font-semibold text-fg">{data.domain.hostname}</dd></dl>
        <p className="text-fg-muted">{data.domain.label}</p>
        {data.domain.warning ? <p className="font-medium text-fg">Cần kiểm tra cấu hình tên miền.</p> : null}
        {links.has("/ten-mien") ? <Link className={linkClass} href="/ten-mien">Quản lý tên miền</Link> : null}
      </Tile> : null}
      {data.plan ? <Tile id="dashboard-plan" title="Gói dịch vụ">
        <dl><dt className="text-fg-muted">Gói hiện tại</dt><dd className="text-2xl font-semibold text-fg">{data.plan.name}</dd></dl>
        <p className="text-fg-muted">{data.plan.expiry}</p>
        {data.plan.warning ? <p className="font-medium text-fg">Cần gia hạn: gói sắp hết hạn hoặc đã hết hạn.</p> : null}
        {links.has("/goi") ? <Link className={linkClass} href="/goi">Xem gói dịch vụ</Link> : null}
      </Tile> : null}
      {data.activity ? <Tile id="dashboard-activity" title="Hoạt động gần đây">
        {data.activity.length ? <ol className="space-y-3">{data.activity.map(row => <li key={row.id} className="min-w-0">
          <p className="[overflow-wrap:anywhere] text-fg">{row.label}</p><time dateTime={row.createdAt.toISOString()} className="text-sm text-fg-muted">{row.createdAt.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</time>
        </li>)}</ol> : <p className="text-fg-muted">Chưa có hoạt động nào.</p>}
      </Tile> : null}
    </div>
  </div>;
}
