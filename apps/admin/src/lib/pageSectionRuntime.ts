import { createPreviewToken, forTenant, Prisma, publishPage, restorePageVersion, saveDraft } from "@solar/db";
import { getTenant } from "./auth.ts";
import { getSiteEntitlements } from "./entitlements.ts";
import { getRuntime } from "./runtime.ts";
import type { PageSectionsDeps } from "./pageSections.ts";
import { recoverRemovedSections } from "./pageSections.ts";
import { previewUrl } from "./previewUrl.ts";
import { editPresence } from "./editPresence.ts";

export const pageSectionDeps: PageSectionsDeps = {
  tenant: getTenant,
  entitlements: getSiteEntitlements,
  async theme(siteId) {
    const site = await forTenant(getRuntime().db, (await getTenant()).tenantId).site.get(siteId);
    return site?.themeId ?? "";
  },
  async removed(siteId, pageId) {
    const repo = forTenant(getRuntime().db, (await getTenant()).tenantId);
    const page = await repo.page.first({ where: { id: pageId, siteId } });
    if (!page) return [];
    const [contents, versions] = await Promise.all([
      repo.sectionContent.list({ where: { siteId, pageId, OR: [{ removedAt: null }, { removedAt: { gte: new Date(Date.now() - 30 * 86400000) } }] } }),
      repo.pageVersion.list({ where: { pageId }, orderBy: { revision: "desc" }, select: { snapshot: true } }),
    ]);
    return recoverRemovedSections(page, contents, versions.map(v => v.snapshot));
  },
  async page(siteId, pageId) {
    const { tenantId } = await getTenant();
    const repo = forTenant(getRuntime().db, tenantId);
    const page = await repo.page.first({ where: { id: pageId, siteId } });
    if (!page) return null;
    const hasDraft = page.draftSections !== null || await repo.sectionContent.count({ where: { siteId, pageId, removedAt: null, draftData: { not: Prisma.DbNull } } }) > 0;
    return { ...page, hasDraft };
  },
  async contents(siteId, pageId) {
    return forTenant(getRuntime().db, (await getTenant()).tenantId).sectionContent.list({ where: { siteId, pageId }, select: { sectionId: true, type: true } });
  },
  async content(siteId, pageId, sectionId) {
    return forTenant(getRuntime().db, (await getTenant()).tenantId).sectionContent.first({ where: { siteId, pageId, sectionId } });
  },
  async contentRows(siteId, pageId) {
    return forTenant(getRuntime().db, (await getTenant()).tenantId).sectionContent.list({ where: { siteId, pageId, removedAt: null },
      select: { sectionId: true, type: true, schemaVersion: true, data: true, draftData: true } });
  },
  async actor(session) {
    // shortcut: ghost không có actor trong site realm; mở rộng cầu nối có audit ở E15 trước khi cho ghi.
    return session.kind === "user" && session.accountId ? { siteUserId: session.accountId } : null;
  },
  save: (tenantId, input) => saveDraft(getRuntime().db, tenantId, input),
  publish: (tenantId, input) => publishPage(getRuntime().db, tenantId, input),
  restore: (tenantId, input) => restorePageVersion(getRuntime().db, tenantId, input),
  async versions(siteId, pageId) {
    const repo = forTenant(getRuntime().db, (await getTenant()).tenantId);
    if (!await repo.page.first({ where: { id: pageId, siteId } })) return [];
    const versions = await repo.pageVersion.list({ where: { pageId }, orderBy: { revision: "desc" }, take: 20,
      include: { publishedBySiteUser: { select: { name: true } } } });
    return versions.map(v => ({ id: v.id, revision: v.revision, createdAt: v.createdAt.toISOString(),
      publisher: v.publishedBySiteUser?.name ?? (v.publishedByPlatformAdminId ? "Quản trị nền tảng" : "Không rõ") }));
  },
  async presence(tenantId, pageId, clientId, session) {
    const user = session.kind === "user" && session.accountId
      ? await forTenant(getRuntime().db, tenantId).siteUser.get(session.accountId) : null;
    return editPresence.touch(`tenant:${tenantId}:page:${pageId}`, clientId, {
      accountId: session.accountId ?? session.id, name: user?.name ?? (session.kind === "ghost" ? "Quản trị nền tảng" : "Không rõ"),
    });
  },
  async preview(tenantId, siteId, slug, path) {
    const runtime = getRuntime();
    const token = await createPreviewToken(runtime.db, tenantId, siteId);
    return previewUrl({ slug, platform: runtime.platform, path, token, production: process.env.NODE_ENV === "production", port: process.env.TENANT_PUBLIC_PORT });
  },
};
