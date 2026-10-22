import { cache } from "react";
import { cookies, draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { loadTenantSite } from "./siteData";
import { parseTenantContext } from "./routeContext";
import { applyPreviewTheme } from "./previewTheme";

/**
 * Cache Components needs one value per root param at build time; this one renders a 404 without touching the database
 * (`next build` has none). Real tenants are rendered on request.
 */
export const BUILD_PLACEHOLDER = "_";
export const placeholderParams = () => [{ tenantId: BUILD_PLACEHOLDER, siteId: BUILD_PLACEHOLDER, ctx: "auto" }];

/**
 * Tenant, site, locale and preview come from the proxy rewrite `/sites/<tenantId>/<siteId>/<ctx>` (E5-S06). Only the proxy
 * can reach /sites/**, and a tenant/site pair that does not match finds nothing through the tenant repository.
 */
export const tenantRoute = cache(async (tenantId: string, siteId: string, ctx: string) => {
  const context = parseTenantContext(ctx);
  if (!context || tenantId === BUILD_PLACEHOLDER) notFound();
  // Request-time route (approved blocking): the process data cache reads the clock outside `"use cache"` scopes.
  await connection();
  if (context.preview && !(await draftMode()).isEnabled) notFound();
  let site = await loadTenantSite(tenantId, siteId, context.locale === "auto" ? undefined : context.locale);
  if (!site) notFound();
  if (context.preview) site = applyPreviewTheme(site, (await cookies()).get("solar-preview-theme")?.value);
  return { site, preview: context.preview };
});
