import { invalidationJob, tenantTag } from "@solar/cache";
import { checkConnection, platformClient, type PlatformDb } from "./client.ts";

const DAY = 86_400_000;

/** The smallest due milestone: assigning a plan with five days left only sends the seven-day reminder. */
export function renewalDays(expiresAt: Date, now: Date): 1 | 7 | 14 | null {
  const remaining = expiresAt.getTime() - now.getTime();
  return remaining > 0 ? ([1, 7, 14] as const).find(days => remaining <= days * DAY) ?? null : null;
}

/** Row locks serialize billing with console renewals; each mutation, audit and job commits together. */
export async function runBillingCron(db: PlatformDb, { now = new Date() }: { now?: Date } = {}) {
  if (!Number.isFinite(now.getTime())) throw new Error("Invalid billing scan time");
  const client = platformClient(db);
  await checkConnection(db);
  const tenants = await client.tenant.findMany({
    where: { status: { in: ["active", "trial"] }, planExpiresAt: { lte: new Date(now.getTime() + 14 * DAY) } },
    select: { id: true }, orderBy: { id: "asc" },
  });
  const result = { reminded: 0, suspended: 0 };
  for (const { id: tenantId } of tenants) {
    const counts = await client.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM public."Tenant" WHERE id = ${tenantId}::uuid FOR UPDATE`;
      // A renewal/deletion or another worker may have changed this row since the scan.
      const tenant = await tx.tenant.findUnique({ where: { id: tenantId } });
      if (!tenant?.planExpiresAt || tenant.status === "suspended") return { reminded: 0, suspended: 0 };
      const expiresAt = tenant.planExpiresAt.toISOString();
      const days = renewalDays(tenant.planExpiresAt, now);
      if (days !== null) {
        const { count } = await tx.outbox.createMany({ skipDuplicates: true, data: [{
          tenantId, topic: "notify.renewal", payload: { tenantId, days, expiresAt },
          idempotencyKey: `renewal:${tenantId}:${expiresAt}:${days}`,
        }] });
        if (count) await tx.auditLog.create({ data: {
          tenantId, actorType: "system", action: "tenant.renewal.reminded", entity: "Tenant", entityId: tenantId,
          data: { days, planExpiresAt: expiresAt },
        } });
        return { reminded: count, suspended: 0 };
      }
      if (tenant.planExpiresAt.getTime() + 7 * DAY > now.getTime()) return { reminded: 0, suspended: 0 };
      const domains = await tx.domain.findMany({ where: { tenantId }, select: { hostname: true } });
      await tx.tenant.update({ where: { id: tenantId }, data: { status: "suspended" } });
      await tx.auditLog.create({ data: {
        tenantId, actorType: "system", action: "tenant.suspend.expired", entity: "Tenant", entityId: tenantId,
        data: { planExpiresAt: expiresAt },
      } });
      await tx.outbox.create({ data: {
        tenantId, ...invalidationJob([tenantTag(tenantId)], { hosts: domains.map(domain => domain.hostname) }),
      } });
      await tx.outbox.createMany({ skipDuplicates: true, data: [{
        tenantId, topic: "notify.suspended", payload: { tenantId, expiresAt },
        idempotencyKey: `suspended:${tenantId}:${expiresAt}`,
      }] });
      return { reminded: 0, suspended: 1 };
    });
    result.reminded += counts.reminded;
    result.suspended += counts.suspended;
  }
  return result;
}
