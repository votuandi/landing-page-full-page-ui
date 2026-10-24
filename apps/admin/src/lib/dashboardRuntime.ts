import { mediaUsage, withTenantTransaction, type Db, type TenantRepo } from "@solar/db";
import type { DashboardDeps } from "./dashboard.ts";

/** Context comes from the verified host, never from request parameters or form data. */
export function createDashboardDeps(db: Db, context: { tenantId: string; siteId: string; slug: string }, platform: string): DashboardDeps {
  const { tenantId, siteId } = context;
  const subject = async (repo: TenantRepo) => {
    const site = await repo.site.first({ where: { id: siteId }, select: { tenant: { select: {
      planId: true, planExpiresAt: true, status: true, addons: true, createdAt: true, limitOverrides: true,
    } } } });
    if (!site) throw new Error("Không tìm thấy website");
    return site.tenant;
  };
  return {
    tenantId,
    leads: windows => withTenantTransaction(db, tenantId, async repo => {
      const [today, week, stale, sources] = await Promise.all([
        repo.lead.count({ where: { createdAt: { gte: windows.today, lte: windows.now } } }),
        repo.lead.count({ where: { createdAt: { gte: windows.week, lte: windows.now } } }),
        repo.lead.count({ where: { status: "new", createdAt: { lt: windows.stale } } }),
        repo.lead.list({ where: { createdAt: { gte: windows.week, lte: windows.now } }, select: { source: true } }),
      ]);
      return { today, week, stale, sources };
    }),
    content: () => withTenantTransaction(db, tenantId, repo => repo.page.list({
      where: { siteId }, orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true, slug: true, title: true, draftSections: true,
        sectionContents: { where: { tenantId }, select: { data: true, draftData: true } } },
    })),
    media: () => withTenantTransaction(db, tenantId, async repo => {
      const [bytes, tenant] = await Promise.all([
        mediaUsage(repo),
        subject(repo),
      ]);
      return { bytes, subject: tenant };
    }),
    domain: () => withTenantTransaction(db, tenantId, async repo => ({
      primary: await repo.domain.first({ where: { siteId, isPrimary: true }, orderBy: { hostname: "asc" }, select: { hostname: true, status: true } }),
      fallback: `${context.slug}.${platform}`,
    })),
    plan: () => withTenantTransaction(db, tenantId, subject),
    activity: () => withTenantTransaction(db, tenantId, repo => repo.auditLog.list({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 10, select: { id: true, action: true, createdAt: true },
    })),
  };
}
