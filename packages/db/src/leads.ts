import type { Prisma } from "../generated/client.ts";
import type { Db, PlatformDb } from "./client.ts";
import { withTenantTransaction } from "./tenantTransaction.ts";

export type LeadInput = {
  source: string; phone: string; name?: string; segment?: string; email?: string; message?: string;
  /** Remaining payload fields (zalo, address, estimate, items, page…). */
  data: Prisma.InputJsonObject;
};

/** D14: the lead and one `lead.deliver` job per enabled channel commit together, or not at all. */
export function createLead(db: Db | PlatformDb, tenantId: string, siteId: string, lead: LeadInput) {
  return withTenantTransaction(db, tenantId, async repo => {
    const row = await repo.lead.create({ siteId, ...lead });
    const integrations = await repo.leadIntegration.list({ where: { enabled: true }, select: { id: true, kind: true }, orderBy: { id: "asc" } });
    for (const { id, kind } of integrations) {
      await repo.outbox.create({
        topic: "lead.deliver", payload: { leadId: row.id, integrationId: id, kind }, idempotencyKey: `lead.deliver:${row.id}:${id}`,
      });
    }
    return { id: row.id, jobs: integrations.length };
  });
}
