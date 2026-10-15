import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import { FEATURES, PLAN_IDS, featureOverridesSchema, limitOverridesSchema } from "@solar/plans";
import { invalidationJob, tenantTag } from "@solar/cache";
import { Prisma } from "../generated/client.ts";
import { checkConnection, platformClient, type PlatformDb } from "./client.ts";

export const tenantPlanChangesSchema = z.strictObject({
  planId: z.enum(PLAN_IDS).optional(),
  planExpiresAt: z.date().nullable().optional(),
  status: z.enum(["active", "suspended"]).optional(),
  addons: z.array(z.enum(FEATURES)).transform(values => [...new Set(values)].sort()).optional(),
  featureOverrides: featureOverridesSchema.optional(),
  limitOverrides: limitOverridesSchema.optional(),
  permissionPolicy: z.record(z.string(), z.json()).optional(),
});
const inputSchema = z.strictObject({
  actorId: z.uuid(), tenantId: z.uuid(), changes: tenantPlanChangesSchema,
  reason: z.string().trim().min(1).max(500).optional(),
});
export type TenantPlanChange = z.input<typeof inputSchema>;

/** Platform callers authenticate the actor; this boundary validates and atomically audits every mutation. */
export async function changeTenantPlan(db: PlatformDb, input: TenantPlanChange) {
  const { actorId, tenantId, changes, reason } = inputSchema.parse(input);
  const client = platformClient(db);
  await checkConnection(db);
  return client.$transaction(async tx => {
    // Serialize competing console changes so the audit's before snapshot cannot be stale.
    await tx.$queryRaw`SELECT id FROM public."Tenant" WHERE id = ${tenantId}::uuid FOR UPDATE`;
    const tenant = await tx.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    if (changes.status === undefined && tenant.status === "suspended" && changes.planExpiresAt
      && changes.planExpiresAt.getTime() > Date.now() && !isDeepStrictEqual(changes.planExpiresAt, tenant.planExpiresAt)) {
      // Only undo billing's suspension; a manual suspension still needs an explicit status change.
      const suspension = await tx.auditLog.findFirst({ where: {
        tenantId, entity: "Tenant", entityId: tenantId, actorType: "system", action: "tenant.suspend.expired",
      }, orderBy: { createdAt: "desc" }, select: { createdAt: true } });
      if (suspension) {
        const manual = await tx.auditLog.findFirst({ where: {
          tenantId, entity: "Tenant", entityId: tenantId, action: "tenant.plan.change",
          createdAt: { gte: suspension.createdAt }, data: { path: ["after", "status"], equals: "suspended" },
        }, select: { id: true } });
        // Equal millisecond timestamps favor the manual suspension rather than random UUID ordering.
        if (!manual) changes.status = "active";
      }
    }
    const before: Record<string, Prisma.InputJsonValue | null> = {}, after: Record<string, Prisma.InputJsonValue | null> = {};
    for (const key of Object.keys(changes) as (keyof typeof changes)[]) {
      const value = changes[key];
      const previous = key === "addons" ? [...tenant.addons].sort() : tenant[key];
      if (value !== undefined && !isDeepStrictEqual(previous, value)) {
        before[key] = tenant[key] instanceof Date ? tenant[key].toISOString() : tenant[key];
        after[key] = value instanceof Date ? value.toISOString() : value;
      }
    }
    if (!Object.keys(after).length) return { changed: false } as const;
    // Only schema-approved keys with actual changes are written.
    await tx.tenant.update({ where: { id: tenantId }, data: Object.fromEntries(
      Object.entries(changes).filter(([key]) => Object.hasOwn(after, key)),
    ) });
    const audit = await tx.auditLog.create({ data: {
      tenantId, actorType: "platform_admin", actorId, action: "tenant.plan.change", entity: "Tenant", entityId: tenantId,
      data: { before, after, ...(reason ? { reason } : {}) },
    } });
    const domains = Object.hasOwn(after, "status")
      ? await tx.domain.findMany({ where: { tenantId }, select: { hostname: true } }) : undefined;
    await tx.outbox.create({ data: { tenantId, ...invalidationJob([tenantTag(tenantId)], { hosts: domains?.map(domain => domain.hostname) }) } });
    if (Object.hasOwn(after, "planId")) await tx.outbox.create({ data: {
      tenantId, topic: "notify.plan-changed", payload: { tenantId, from: tenant.planId, to: changes.planId! },
      idempotencyKey: `notify.plan-changed:${audit.id}`,
    } });
    return { changed: true, auditId: audit.id } as const;
  });
}

export function expiredOverrideDates(features: unknown, limits: unknown, now: Date): string[] {
  const dates = new Set<string>();
  for (const [raw, schema] of [[features, featureOverridesSchema], [limits, limitOverridesSchema]] as const) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    for (const [key, value] of Object.entries(raw)) {
      // Match entitlement resolution: one invalid legacy entry does not hide valid entries.
      const parsed = schema.safeParse({ [key]: value });
      if (!parsed.success) continue;
      const until = Object.values(parsed.data)[0]?.until;
      const time = until ? Date.parse(until) : NaN;
      if (time > now.getTime() - 86_400_000 && time <= now.getTime()) dates.add(new Date(time).toISOString());
    }
  }
  return [...dates].sort();
}

/** Replays the last 24 h after downtime; durable keys deduplicate multiple scans/workers. */
export async function scanExpiredOverrides(db: PlatformDb, { now = new Date() }: { now?: Date } = {}) {
  if (!Number.isFinite(now.getTime())) throw new Error("Invalid override scan time");
  const client = platformClient(db);
  await checkConnection(db);
  const tenants = await client.tenant.findMany({
    where: { OR: [{ featureOverrides: { not: {} } }, { limitOverrides: { not: {} } }] },
    select: { id: true, featureOverrides: true, limitOverrides: true },
  });
  let queued = 0;
  for (const tenant of tenants) {
    const dates = expiredOverrideDates(tenant.featureOverrides, tenant.limitOverrides, now);
    if (!dates.length) continue;
    queued += await client.$transaction(async tx => {
      const { count } = await tx.outbox.createMany({ skipDuplicates: true, data: dates.map(until => ({
        tenantId: tenant.id, ...invalidationJob([tenantTag(tenant.id)]),
        idempotencyKey: `override-expired:${tenant.id}:${until}`,
      })) });
      if (count) await tx.auditLog.create({ data: {
        tenantId: tenant.id, actorType: "system", action: "tenant.override.expired", entity: "Tenant", entityId: tenant.id,
        data: { until: dates },
      } });
      return count;
    });
  }
  return { queued };
}
