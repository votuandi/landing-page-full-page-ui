import { exportTenant, forTenant } from "@solar/db";
import { getRuntime } from "./runtime.ts";
import { createBackupHandler } from "./tenantBackup.ts";

export const backupHandler = createBackupHandler({
  export: tenantId => exportTenant(getRuntime().db, tenantId),
  audit: async (tenantId, session) => {
    const repo = forTenant(getRuntime().db, tenantId);
    const ghost = session.kind === "ghost" ? await repo.siteSession.first({ where: { id: session.id }, select: { ghostGrantId: true } }) : null;
    await repo.auditLog.create({
      action: "tenant.backup.export", entity: "Tenant", entityId: tenantId,
      actorType: session.kind === "ghost" ? "platform_admin" : "site_user", actorId: session.accountId,
      ghostGrantId: ghost?.ghostGrantId ?? null,
    });
  },
});
