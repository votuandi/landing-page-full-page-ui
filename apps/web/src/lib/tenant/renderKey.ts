import type { TenantSite } from "./siteData";

/** Request snapshot: a refreshed kill switch must never reuse UI rendered with the old permissions. */
export function tenantRenderKey(site: Pick<TenantSite, "tenantId" | "siteId" | "locale"> & { theme?: { meta: { id?: string } }; entitlements: { disabled: readonly string[] } }, preview: boolean) {
  return { tenantId: site.tenantId, siteId: site.siteId, locale: site.locale, preview,
    disabled: JSON.stringify([...site.entitlements.disabled].sort()), themeId: preview ? site.theme?.meta.id : undefined };
}
export type TenantRenderKey = ReturnType<typeof tenantRenderKey>;
