import Link from "next/link";
import { forTenant } from "@solar/db";
import { PAGE_TEMPLATES, isLandingSlug } from "@solar/presets";
import { getTenant, requirePagePermission } from "../../../../lib/auth.ts";
import { getRuntime } from "../../../../lib/runtime.ts";
import { getSiteEntitlements } from "../../../../lib/entitlements.ts";
import { pageTitle } from "../../../../lib/pageSections.ts";
import { LandingPagesSummary } from "../LandingPagesSummary.tsx";
import { CreateLandingForm } from "./CreateLandingForm.tsx";
import { limit } from "@solar/plans";

export default async function NewLandingPage() {
  await requirePagePermission("pages.structure");
  const { tenantId, siteId } = await getTenant(), repo = forTenant(getRuntime().db, tenantId);
  const can = await getSiteEntitlements();
  const site = (await repo.site.first({ where: { id: siteId }, include: { tenant: true } }))!;
  const pages = await repo.page.list({ where: { siteId }, select: { id: true, slug: true, title: true }, orderBy: { slug: "asc" } });
  const count = pages.filter(p => p.slug === "" || isLandingSlug(p.slug)).length, pagesLimit = limit(site.tenant, "pages");
  const full = count >= pagesLimit;
  return <section className="min-w-0 max-w-3xl space-y-6">
    <Link href="/trang" className="inline-flex min-h-11 items-center rounded-button text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Về danh sách trang</Link>
    <div className="space-y-2">
      <h1 className="text-balance text-2xl font-semibold text-fg">Tạo landing page</h1>
      <p className="text-pretty text-fg-muted">Trang mới được lưu ở dạng nháp. Sắp xếp section, đặt SEO rồi bấm Xuất bản để đưa lên website.</p>
    </div>
    {!can("landingPages")
      ? <LandingPagesSummary count={count} limit={pagesLimit} reason="Gói hiện tại chưa có landing page" upgrade />
      : <>
        <p className={`text-sm tabular-nums ${full ? "text-danger" : "text-fg-muted"}`}>
          Đã dùng {count}/{Number.isFinite(pagesLimit) ? pagesLimit : "không giới hạn"} trang{full ? " — đã đạt giới hạn của gói, yêu cầu tạo trang sẽ bị từ chối." : ""}
        </p>
        <CreateLandingForm templates={Object.entries(PAGE_TEMPLATES).map(([id, t]) => ({ id, label: t.label.vi }))} pages={pages.map(page => ({ id: page.id, title: pageTitle(page.title, page.slug) }))} />
      </>}
  </section>;
}
