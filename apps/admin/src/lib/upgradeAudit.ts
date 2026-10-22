import { withTenantTransaction, type Db } from "@solar/db";
import type { UpgradeRecord } from "./upgrade.ts";

export async function recordUpgradeRequest(db: Db, input: UpgradeRecord, since: Date) {
  // Serializable predicate reads prevent concurrent requests from creating duplicate leads.
  for (let attempt = 0; ; attempt++) {
    try {
      await withTenantTransaction(db, input.tenantId, async repo => {
        const existing = await repo.auditLog.first({ where: { action: "plan.upgrade_requested", createdAt: { gt: since }, data: { path: ["feature"], equals: input.feature } } });
        if (!existing) await repo.auditLog.create({ actorType: "site_user", actorId: input.actorId, action: "plan.upgrade_requested", entity: "Tenant", entityId: input.tenantId,
          data: { feature: input.feature, message: input.message ?? "" } });
      }, { isolationLevel: "Serializable" });
      return;
    } catch (error) {
      if (attempt >= 2 || !(error instanceof Error) || !("code" in error) || error.code !== "P2034") throw error;
    }
  }
}
