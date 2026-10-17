import type { TenantSite } from "./siteData";

/** Request snapshot: a refreshed kill switch must never reuse UI rendered with the old permissions. */
export function tenantRenderKey(site: Pick<TenantSite, "tenantId" | "siteId" | "locale"> & { entitlements: { disabled: readonly string[] } }, preview: boolean) {
  return { tenantId: site.tenantId, siteId: site.siteId, locale: site.locale, preview,
    disabled: JSON.stringify([...site.entitlements.disabled].sort()) };
}
export type TenantRenderKey = ReturnType<typeof tenantRenderKey>;
