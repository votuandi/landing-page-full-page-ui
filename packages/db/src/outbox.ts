import { Prisma } from "../generated/client.ts";
import { platformClient, type PlatformDb } from "./client.ts";

export type OutboxJob = {
  id: string; tenantId: string | null; topic: string; payload: unknown; idempotencyKey: string;
  attempts: number; createdAt: Date; runAt: Date;
};
export type NewOutboxJob = { tenantId?: string | null; topic: string; payload: Prisma.InputJsonValue; idempotencyKey: string; runAt?: Date };
type Clock = { now?: Date };

const DAY = 24 * 60 * 60 * 1000;
// Prisma stores timestamp(3) as UTC wall time; cast explicitly so the session time zone never matters.
const at = (date: Date) => Prisma.sql`(${date.toISOString()}::timestamptz AT TIME ZONE 'UTC')`;
/** 30 s, 60 s, 2 min … capped at 6 h, ±10% jitter so workers do not retry in lockstep. */
export const backoffMs = (attempts: number, random = Math.random) =>
  Math.min(30_000 * 2 ** Math.max(0, attempts - 1), 6 * 60 * 60 * 1000) * (0.9 + 0.2 * random());

// Worker side of D14. `failed` is the dead state: no more automatic retries, only `resend`.
export function outboxRepository(db: PlatformDb) {
  const client = platformClient(db);
  // `attempts` is the lease token: a worker whose lease expired cannot overwrite the job another worker re-claimed.
  const claimed = (job: OutboxJob) => ({ id: job.id, attempts: job.attempts, status: "processing" as const });
  return {
    /** Jobs that are due, plus `processing` jobs whose lease expired (the worker died mid-job). */
    claim({ limit = 10, leaseMs = 60_000, topics, tenantId, now = new Date() }: Clock & {
      limit?: number; leaseMs?: number; topics?: readonly string[]; tenantId?: string;
    } = {}) {
      const topic = topics ? Prisma.sql`AND topic = ANY(${[...topics]}::text[])` : Prisma.empty;
      const tenant = tenantId ? Prisma.sql`AND "tenantId" = ${tenantId}::uuid` : Prisma.empty;
      return client.$queryRaw<OutboxJob[]>`
        UPDATE public."Outbox" SET status = 'processing', attempts = attempts + 1, "runAt" = ${at(new Date(now.getTime() + leaseMs))}
        WHERE id IN (
          SELECT id FROM public."Outbox" WHERE status IN ('pending', 'processing') AND "runAt" <= ${at(now)} ${topic} ${tenant}
          ORDER BY "runAt" LIMIT ${limit} FOR UPDATE SKIP LOCKED)
        RETURNING id, "tenantId", topic, payload, "idempotencyKey", attempts, "createdAt", "runAt"`;
    },
    async complete(job: OutboxJob, { now = new Date() }: Clock = {}) {
      return (await client.outbox.updateMany({ where: claimed(job), data: { status: "done", processedAt: now, lastError: null } })).count === 1;
    },
    /** Retry with backoff, or go dead once `maxAgeMs` (default 24 h) has passed or the error is permanent. */
    async fail(job: OutboxJob, error: unknown, { now = new Date(), maxAgeMs = DAY, dead = false }: Clock & { maxAgeMs?: number; dead?: boolean } = {}) {
      const lastError = (error instanceof Error ? error.message : String(error)).slice(0, 1000);
      if (dead || now.getTime() - job.createdAt.getTime() >= maxAgeMs) {
        const { count } = await client.outbox.updateMany({ where: claimed(job), data: { status: "failed", processedAt: now, lastError } });
        if (count) {
          console.error("[outbox] dead", { id: job.id, topic: job.topic, tenantId: job.tenantId, attempts: job.attempts, lastError });
          await client.auditLog.create({ data: { tenantId: job.tenantId, actorType: "system", action: "outbox.dead", entity: "Outbox", entityId: job.id, data: { topic: job.topic, attempts: job.attempts, lastError } } });
        }
        return "dead" as const;
      }
      await client.outbox.updateMany({ where: claimed(job), data: { status: "pending", runAt: new Date(now.getTime() + backoffMs(job.attempts)), lastError } });
      return "retry" as const;
    },
    /** "Gửi lại" in the lead inbox: a dead job of this tenant starts over. */
    async resend({ tenantId, id, actor, now = new Date() }: Clock & { tenantId: string; id: string; actor?: { type: "site_user" | "platform_admin"; id: string } }) {
      const { count } = await client.outbox.updateMany({ where: { id, tenantId, status: "failed" }, data: { status: "pending", attempts: 0, runAt: now, lastError: null, processedAt: null } });
      if (count) await client.auditLog.create({ data: { tenantId, actorType: actor?.type ?? "system", actorId: actor?.id, action: "outbox.resend", entity: "Outbox", entityId: id } });
      return count === 1;
    },
    /** Platform jobs (cron); an existing idempotency key means the job was already queued. */
    async enqueue(jobs: readonly NewOutboxJob[]) {
      return (await client.outbox.createMany({ data: [...jobs], skipDuplicates: true })).count;
    },
  };
}
