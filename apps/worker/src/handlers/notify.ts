import { z } from "zod";
import { forTenant, type OutboxJob, type PlatformDb } from "@solar/db";
import { PermanentError } from "../loop.ts";

export type Notification = { tenantId: string; kind: string; payload: Record<string, unknown>; idempotencyKey: string };
export type Notifier = { send(input: Notification): Promise<void> };
const payloadSchema = z.object({ tenantId: z.uuid() }).catchall(z.json());

/** Shared notify.* adapter boundary; each supported topic is registered explicitly in main. */
export function createNotify({ notifier }: { notifier: Notifier }) {
  return async (job: OutboxJob) => {
    const parsed = payloadSchema.safeParse(job.payload);
    if (!parsed.success || !job.tenantId || parsed.data.tenantId !== job.tenantId || !/^notify\.[a-z][a-z.-]*$/.test(job.topic)) {
      throw new PermanentError("notify: payload hoặc tenant không hợp lệ");
    }
    await notifier.send({ tenantId: job.tenantId, kind: job.topic.slice("notify.".length), payload: parsed.data, idempotencyKey: job.idempotencyKey });
  };
}

/** E11-S02 supplies email/Telegram adapters; this default only records intended owner delivery. */
export function createLogNotifier(db: PlatformDb): Notifier {
  return { async send({ tenantId, kind, idempotencyKey }) {
    const owners = await forTenant(db, tenantId).siteUser.list({ where: { role: "owner" }, select: { id: true, email: true, contactPhone: true } });
    console.log("[notify]", { tenantId, kind, idempotencyKey,
      owners: owners.map(owner => ({ id: owner.id, hasEmail: Boolean(owner.email), hasContactPhone: Boolean(owner.contactPhone) })),
    });
  } };
}
