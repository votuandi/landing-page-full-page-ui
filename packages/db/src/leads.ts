import type { Prisma } from "../generated/client.ts";
import type { Db, PlatformDb } from "./client.ts";
import { withTenantTransaction, tenantTransaction } from "./tenantTransaction.ts";
import { forTenant } from "./repository.ts";

export type LeadFilters = { status?: "new" | "contacted" | "quoted" | "won" | "lost" | "spam"; source?: string; q?: string; from?: string; until?: string };
export type LeadPatch = { status?: LeadFilters["status"]; note?: string; assigneeId?: string | null; branchId?: string | null };
export type LeadActor = { type: "site_user" | "platform_admin"; id: string; ghostGrantId?: string | null };

const leadWhere = (filters: LeadFilters): Prisma.LeadWhereInput => ({
  status: filters.status ?? { not: "spam" },
  ...(filters.source ? { source: filters.source } : {}),
  ...(filters.q ? { OR: [{ name: { contains: filters.q, mode: "insensitive" } }, { phone: { contains: filters.q } }] } : {}),
  ...(filters.from || filters.until ? { createdAt: { ...(filters.from ? { gte: new Date(filters.from) } : {}), ...(filters.until ? { lt: new Date(filters.until) } : {}) } } : {}),
});

/** Keyset pagination uses both timestamp and id, including when many leads share a millisecond. */
export function listLeads(db: Db | PlatformDb, tenantId: string, filters: LeadFilters = {}, { limit = 100, cursor }: { limit?: number; cursor?: string } = {}) {
  return withTenantTransaction(db, tenantId, async repo => {
    const after = cursor ? await repo.lead.get(cursor) : null;
    // A foreign/deleted cursor must not restart the first page and repeat rows.
    if (cursor && !after) return { rows: [], cursor: null };
    const size = Math.min(100, Math.max(1, Math.floor(limit)));
    const rows = await repo.lead.list({ where: { AND: [leadWhere(filters), ...(after ? [{ OR: [
      { createdAt: { lt: after.createdAt } }, { createdAt: after.createdAt, id: { lt: after.id } },
    ] }] : [])] }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: size + 1 });
    const more = rows.length > size, page = rows.slice(0, size), ids = page.map(row => row.id);
    const jobs = ids.length ? await repo.outbox.list({ where: { topic: "lead.deliver", OR: ids.map(id => ({ payload: { path: ["leadId"], equals: id } })) },
      select: { id: true, payload: true, status: true, attempts: true }, orderBy: { createdAt: "asc" } }) : [];
    return { rows: page.map(row => ({ ...row, jobs: jobs.filter(job => (job.payload as { leadId?: string })?.leadId === row.id) })), cursor: more ? page.at(-1)!.id : null };
  });
}
export type InboxLead = Awaited<ReturnType<typeof listLeads>>["rows"][number];

export function updateLead(db: Db | PlatformDb, tenantId: string, id: string, patch: LeadPatch, actor: LeadActor) {
  return withTenantTransaction(db, tenantId, async repo => {
    if (!await repo.lead.get(id)) return false;
    if (patch.assigneeId && !await repo.siteUser.first({ where: { id: patch.assigneeId, role: { not: "client" } } })) return false;
    if (patch.branchId && !await repo.branch.get(patch.branchId)) return false;
    if (!(await repo.lead.update(id, patch)).count) return false;
    await repo.auditLog.create({ actorType: actor.type, actorId: actor.id, ghostGrantId: actor.ghostGrantId, action: "lead.update", entity: "Lead", entityId: id,
      data: { fields: Object.keys(patch) } });
    return true;
  });
}
export function deleteLead(db: Db | PlatformDb, tenantId: string, id: string, actor: LeadActor) {
  return tenantTransaction(db, tenantId, async tx => {
    // Explicit tenant predicates remain necessary even with RLS (platform client may be passed).
    const deleted = await tx.lead.deleteMany({ where: { tenantId, id } });
    if (!deleted.count) return false;
    await tx.outbox.deleteMany({ where: { tenantId, topic: "lead.deliver", status: { not: "done" }, payload: { path: ["leadId"], equals: id } } });
    await tx.auditLog.create({ data: { tenantId, actorType: actor.type, actorId: actor.id, ghostGrantId: actor.ghostGrantId, action: "lead.delete", entity: "Lead", entityId: id, data: {} } });
    return true;
  });
}
/** Tenant-scoped equivalent of outbox resend: admin must never open a platform worker client. */
export function resendLead(db: Db | PlatformDb, tenantId: string, leadId: string, id: string, actor: LeadActor, now = new Date()) {
  return withTenantTransaction(db, tenantId, async repo => {
    if (!await repo.lead.get(leadId)) return false;
    const where = { topic: "lead.deliver", status: "failed" as const, payload: { path: ["leadId"], equals: leadId } };
    const job = await repo.outbox.first({ where: { id, ...where } });
    if (!job) return false;
    if (!(await repo.outbox.update(id, { status: "pending", attempts: 0, runAt: now, createdAt: now, lastError: null, processedAt: null }, where)).count) return false;
    await repo.auditLog.create({ actorType: actor.type, actorId: actor.id, ghostGrantId: actor.ghostGrantId, action: "outbox.resend", entity: "Outbox", entityId: id,
      data: { previousCreatedAt: job.createdAt.toISOString(), attempts: job.attempts } });
    return true;
  });
}
export async function latestLeadAt(db: Db | PlatformDb, tenantId: string) {
  const row = await forTenant(db, tenantId).lead.first({ where: { status: { not: "spam" } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true, createdAt: true } });
  return row ? `${row.createdAt.toISOString()}:${row.id}` : null;
}
/** Aggregate in PostgreSQL so the dashboard never loads every lead's PII to count it. */
export function leadWeeklySources(db: Db | PlatformDb, tenantId: string, now = new Date()) {
  return tenantTransaction(db, tenantId, tx => tx.$queryRaw<{ source: string; createdAt: Date; count: number }[]>`
    SELECT source, (date_trunc('week', "createdAt" + interval '7 hours') - interval '7 hours') AS "createdAt", count(*)::int AS count
    FROM public."Lead" WHERE "tenantId" = ${tenantId}::uuid AND status <> 'spam'
      AND "createdAt" >= (date_trunc('week', ${now.toISOString()}::timestamptz AT TIME ZONE 'Asia/Ho_Chi_Minh') - interval '7 weeks' - interval '7 hours')
    GROUP BY source, date_trunc('week', "createdAt" + interval '7 hours') ORDER BY "createdAt", source`);
}

export type LeadInput = {
  source: string; phone: string; name?: string; segment?: string; email?: string; message?: string;
  /** Remaining payload fields (zalo, address, estimate, items, page…). */
  data: Prisma.InputJsonObject;
};

/** D14: the lead and one `lead.deliver` job per enabled channel commit together, or not at all. */
export function createLead(db: Db | PlatformDb, tenantId: string, siteId: string, lead: LeadInput, options?: { kinds: readonly string[] }) {
  return withTenantTransaction(db, tenantId, async repo => {
    const row = await repo.lead.create({ siteId, ...lead });
    const enabled = await repo.leadIntegration.list({ where: { enabled: true }, select: { id: true, kind: true }, orderBy: { id: "asc" } });
    const integrations = enabled.filter(channel => !options || options.kinds.includes(channel.kind));
    for (const { id, kind } of integrations) {
      await repo.outbox.create({
        topic: "lead.deliver", payload: { leadId: row.id, integrationId: id, kind }, idempotencyKey: `lead.deliver:${row.id}:${id}`,
      });
    }
    return { id: row.id, jobs: integrations.length };
  });
}
