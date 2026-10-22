import { getTenant } from "./auth.ts";
import { getSiteEntitlements } from "./entitlements.ts";
import { getRuntime } from "./runtime.ts";
import { siteSettingsDeps } from "./siteSettingsRuntime.ts";
import { createUpgradeHandler } from "./upgrade.ts";
import { recordUpgradeRequest } from "./upgradeAudit.ts";

export const upgradeHandler = createUpgradeHandler({
  async tenant() {
    const tenant = await getTenant(), site = await siteSettingsDeps.load(tenant.tenantId, tenant.siteId);
    if (!site) throw new Error("Missing site");
    return { tenantId: tenant.tenantId, planId: site.planId };
  },
  entitlements: getSiteEntitlements,
  record: (input, since) => recordUpgradeRequest(getRuntime().db, input, since),
});
