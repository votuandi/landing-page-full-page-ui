import Link from "next/link";
import { forTenant, Prisma } from "@solar/db";
import { getTenant, requirePagePermission } from "../../../lib/auth.ts";
import { getRuntime } from "../../../lib/runtime.ts";
import { pageTitle } from "../../../lib/pageSections.ts";
import { PAGE_TYPES, PAGE_TYPE_IDS, pageTypeOfRoute } from "@solar/presets";
import { getSiteEntitlements } from "../../../lib/entitlements.ts";
import { PageTypeForm } from "./PageTypeForm.tsx";

export default async function Pages() {
  const session = await requirePagePermission("pages.view");
  const { tenantId, siteId } = await getTenant();
  const repo = forTenant(getRuntime().db, tenantId);
  const pages = await repo.page.list({ where: { siteId }, orderBy: { slug: "asc" } });
  const contents = await repo.sectionContent.list({ where: { siteId, removedAt: null, draftData: { not: Prisma.DbNull } }, select: { pageId: true } });
  const draftPages = new Set(contents.map(c => c.pageId));
  const site = (await repo.site.get(siteId))!;
  const can = await getSiteEntitlements();
  return <section className="space-y-6">
    <div><h1 className="text-2xl font-semibold text-fg">Trang &amp; Section</h1><p className="mt-2 text-fg-muted">Chọn trang để sắp xếp section và lưu bản nháp.</p></div>
    <section aria-labelledby="page-catalog" className="space-y-3">
      <h2 id="page-catalog" className="text-lg font-semibold text-fg">Danh mục trang</h2>
      <p className="text-sm text-fg-muted">Áp dụng ngay sau khi lưu. Tắt trang vẫn giữ nội dung để bật lại sau.</p>
      <ul className="grid gap-3 sm:grid-cols-2">{PAGE_TYPE_IDS.map(type => {
        const def = PAGE_TYPES[type], outside = def.entitlement && !can(def.entitlement);
        const reason = def.required ? "Bắt buộc" : !session.permissions.has("pages.structure") ? "Bạn không có quyền đổi cấu trúc trang" : !can("pageStructure") || outside ? "Cần nâng cấp gói" : undefined;
        return <PageTypeForm key={`${type}:${site.pageTypes.join(",")}`} siteId={siteId} type={type} label={def.label.vi} slug={def.slug} enabled={site.pageTypes.includes(type)} expected={site.pageTypes}
          reason={reason} upgrade={!def.required && session.permissions.has("pages.structure") ? !can("pageStructure") ? "pageStructure" : outside ? def.entitlement : undefined : undefined} />;
      })}</ul>
    </section>
    {!pages.length && <p className="text-fg-muted">Site chưa có trang nào.</p>}
    <ul className="space-y-3">{pages.map(page => {
      const draft = page.draftSections !== null || draftPages.has(page.id);
      const type = pageTypeOfRoute({ kind: "page", slug: page.slug });
      const disabled = type && !site.pageTypes.includes(type);
      return <li key={page.id} className="rounded-card border border-line/20 bg-bg-elevated">
        <Link href={`/trang/${page.id}`} className="flex min-h-11 flex-wrap items-center justify-between gap-3 rounded-card p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <span className="min-w-0 break-words font-medium text-fg">{pageTitle(page.title, page.slug)} <span className="text-sm text-fg-muted">/{page.slug}</span></span>
          <span className="text-sm text-fg-muted">{disabled ? "Đã tắt" : draft ? "Có bản nháp" : page.publishedAt ? "Đã xuất bản" : "Chưa xuất bản"}</span>
        </Link>
      </li>;
    })}</ul>
  </section>;
}
