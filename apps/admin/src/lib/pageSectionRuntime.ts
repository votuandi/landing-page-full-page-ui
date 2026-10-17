import { createPreviewToken, forTenant, Prisma, publishPage, saveDraft } from "@solar/db";
import { getTenant } from "./auth.ts";
import { getSiteEntitlements } from "./entitlements.ts";
import { getRuntime } from "./runtime.ts";
import type { PageSectionsDeps } from "./pageSections.ts";

export const pageSectionDeps: PageSectionsDeps = {
  tenant: getTenant,
  entitlements: getSiteEntitlements,
  async page(siteId, pageId) {
    const { tenantId } = await getTenant();
    const repo = forTenant(getRuntime().db, tenantId);
    const page = await repo.page.first({ where: { id: pageId, siteId } });
    if (!page) return null;
    const hasDraft = page.draftSections !== null || await repo.sectionContent.count({ where: { siteId, pageId, draftData: { not: Prisma.DbNull } } }) > 0;
    return { ...page, hasDraft };
  },
  async contents(siteId, pageId) {
    return forTenant(getRuntime().db, (await getTenant()).tenantId).sectionContent.list({ where: { siteId, pageId }, select: { sectionId: true, type: true } });
  },
  async actor(session) {
    // shortcut: ghost không có actor trong site realm; mở rộng cầu nối có audit ở E15 trước khi cho ghi.
    return session.kind === "user" && session.accountId ? { siteUserId: session.accountId } : null;
  },
  save: (tenantId, input) => saveDraft(getRuntime().db, tenantId, input),
  publish: (tenantId, input) => publishPage(getRuntime().db, tenantId, input),
  async preview(tenantId, siteId, slug, path) {
    const runtime = getRuntime();
    const token = await createPreviewToken(runtime.db, tenantId, siteId);
    const url = new URL(`${process.env.NODE_ENV === "production" ? "https" : "http"}://${slug}.preview.${runtime.platform}/api/preview`);
    url.searchParams.set("token", token); url.searchParams.set("path", path);
    return url.toString();
  },
};
