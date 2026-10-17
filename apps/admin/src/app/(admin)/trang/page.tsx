import Link from "next/link";
import { forTenant, Prisma } from "@solar/db";
import { getTenant, requirePagePermission } from "../../../lib/auth.ts";
import { getRuntime } from "../../../lib/runtime.ts";
import { pageTitle } from "../../../lib/pageSections.ts";

export default async function Pages() {
  await requirePagePermission("pages.view");
  const { tenantId, siteId } = await getTenant();
  const repo = forTenant(getRuntime().db, tenantId);
  const pages = await repo.page.list({ where: { siteId }, orderBy: { slug: "asc" } });
  const contents = await repo.sectionContent.list({ where: { siteId, draftData: { not: Prisma.DbNull } }, select: { pageId: true } });
  const draftPages = new Set(contents.map(c => c.pageId));
  return <section className="space-y-6">
    <div><h1 className="text-2xl font-semibold text-fg">Trang &amp; Section</h1><p className="mt-2 text-fg-muted">Chọn trang để sắp xếp section và lưu bản nháp.</p></div>
    {!pages.length && <p className="text-fg-muted">Site chưa có trang nào.</p>}
    <ul className="space-y-3">{pages.map(page => {
      const draft = page.draftSections !== null || draftPages.has(page.id);
      return <li key={page.id} className="rounded-card border border-line/20 bg-bg-elevated">
        <Link href={`/trang/${page.id}`} className="flex min-h-11 flex-wrap items-center justify-between gap-3 rounded-card p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <span className="min-w-0 break-words font-medium text-fg">{pageTitle(page.title, page.slug)} <span className="text-sm text-fg-muted">/{page.slug}</span></span>
          <span className="text-sm text-fg-muted">{draft ? "Có bản nháp" : page.publishedAt ? "Đã xuất bản" : "Chưa xuất bản"}</span>
        </Link>
      </li>;
    })}</ul>
  </section>;
}
