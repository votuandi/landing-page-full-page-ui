import { can, TRIAL_DAYS, type EntitlementSubject } from "@solar/plans";
import { loadDisabledFeatures, type Db, type PlatformDb } from "./client.ts";
import { tenantTransaction } from "./tenantTransaction.ts";

export function eligibleLeadSender(row: { hostname: string; status: string; tenant: EntitlementSubject & { name: string } } | null, disabled: readonly string[]) {
  if (!row || row.status !== "verified" || !can(row.tenant, "senderDomain", { disabled })) return null;
  if (row.tenant.status === "trial" && Date.now() >= row.tenant.createdAt.getTime() + TRIAL_DAYS * 86400_000) return null;
  return { hostname: row.hostname, name: row.tenant.name };
}

/** Re-evaluate at delivery time: queued leads must respect today's subscription and kill switch. */
export async function findLeadSender(db: Db | PlatformDb, tenantId: string) {
  const disabled = await loadDisabledFeatures(db);
  return tenantTransaction(db, tenantId, async tx => {
    const row = await tx.sendingDomain.findFirst({ where: { tenantId, status: "verified" }, include: { tenant: true } });
    return eligibleLeadSender(row, disabled);
  });
}

export function demoteSendingDomain(db: Db | PlatformDb, tenantId: string, hostname: string) {
  return tenantTransaction(db, tenantId, async tx => {
    const result = await tx.sendingDomain.updateMany({ where: { tenantId, hostname, status: "verified" }, data: { status: "failed", verifiedAt: null } });
    if (result.count) await tx.auditLog.create({ data: { tenantId, actorType: "system", action: "senderDomain.rejected", entity: "SendingDomain", data: { hostname } } });
  });
}
