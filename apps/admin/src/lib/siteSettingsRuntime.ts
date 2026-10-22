import { createPreviewToken, forTenant, saveSiteSettings } from "@solar/db";
import { getTenant, requirePagePermission } from "./auth.ts";
import { getSiteEntitlements } from "./entitlements.ts";
import { getRuntime } from "./runtime.ts";
import { previewUrl } from "./previewUrl.ts";
import { createSiteSettingsHandlers, type SiteSettingsDeps } from "./siteSettings.ts";

export const siteSettingsDeps: SiteSettingsDeps = {
  requirePermission: requirePagePermission, tenant: getTenant, entitlements: getSiteEntitlements,
  async load(tenantId, siteId) {
    const row = await forTenant(getRuntime().db, tenantId).site.first({ where: { id: siteId }, include: { tenant: true } });
    return row ? { ...row, planId: row.tenant.planId } : null;
  },
  save: (tenantId, siteId, patch, expected) => saveSiteSettings(getRuntime().db, tenantId, siteId, patch, expected),
  async preview(tenantId, siteId, slug) {
    const runtime = getRuntime(), token = await createPreviewToken(runtime.db, tenantId, siteId);
    return previewUrl({ slug, platform: runtime.platform, path: "/", token, production: process.env.NODE_ENV === "production", port: process.env.TENANT_PUBLIC_PORT });
  },
};
export const siteSettingsHandlers = createSiteSettingsHandlers(siteSettingsDeps);
