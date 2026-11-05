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
  if (!can("landingPages")) return <LandingPagesSummary count={count} limit={pagesLimit} reason="Gói hiện tại chưa có landing page" upgrade />;
  return <section className="min-w-0 space-y-6">
    <Link href="/trang" className="inline-flex min-h-11 items-center text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Về danh sách trang</Link>
    <h1 className="text-2xl font-semibold text-fg">Tạo landing page</h1>
    <p className="text-fg-muted">Đã dùng {count}/{Number.isFinite(pagesLimit) ? pagesLimit : "không giới hạn"} trang</p>
    {count >= pagesLimit && <p role="status" className="text-fg-muted">Đã đạt giới hạn số trang của gói. Yêu cầu tạo trang sẽ bị từ chối.</p>}
    <CreateLandingForm templates={Object.entries(PAGE_TEMPLATES).map(([id, t]) => ({ id, label: t.label.vi }))} pages={pages.map(page => ({ id: page.id, title: pageTitle(page.title, page.slug) }))} />
  </section>;
}
