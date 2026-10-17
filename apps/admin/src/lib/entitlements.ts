import { cache } from "react";
import { notFound } from "next/navigation";
import { forTenant, loadDisabledFeatures } from "@solar/db";
import { canUse, disabledFeaturesSchema, type Feature } from "@solar/plans";
import { getTenant } from "./auth.ts";
import { getRuntime } from "./runtime.ts";

/** Request memoization only: admin entitlement decisions never enter a shared page cache. */
export const getSiteEntitlements = cache(async () => {
  const { tenantId, siteId } = await getTenant();
  const { db } = getRuntime();
  const row = await forTenant(db, tenantId).site.first({ where: { id: siteId }, include: { tenant: true } });
  if (!row) notFound();
  const disabled = disabledFeaturesSchema.parse(await loadDisabledFeatures(db));
  const tenant = row.tenant;
  return canUse({ planId: tenant.planId, addons: tenant.addons, status: tenant.status, createdAt: tenant.createdAt,
    featureOverrides: tenant.featureOverrides, limitOverrides: tenant.limitOverrides }, { disabled });
});

export function assertPageFeature(can: (feature: string) => boolean, feature: Feature): void {
  if (!can(feature)) notFound();
}
