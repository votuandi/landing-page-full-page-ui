import { z } from "zod";
import { forTenant, type OutboxJob, type PlatformDb } from "@solar/db";
import { ChannelError, notifyMail, type MailSender } from "@solar/leads";
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

/** Development fallback: record only delivery metadata, never recipient addresses or payload. */
export function createLogNotifier(db: PlatformDb, repository = forTenant): Notifier {
  return { async send({ tenantId, kind, idempotencyKey }) {
    const owners = await repository(db, tenantId).siteUser.list({ where: { role: "owner", status: { not: "disabled" } }, select: { id: true, email: true, contactPhone: true } });
    console.log("[notify]", { tenantId, kind, idempotencyKey,
      owners: owners.map(owner => ({ id: owner.id, hasEmail: Boolean(owner.email), hasContactPhone: Boolean(owner.contactPhone) })),
    });
  } };
}

const notificationSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("plan-changed"), payload: z.object({ from: z.string().min(1), to: z.string().min(1) }) }),
  z.object({ kind: z.literal("renewal"), payload: z.object({ days: z.union([z.literal(1), z.literal(7), z.literal(14)]), expiresAt: z.iso.datetime() }) }),
  z.object({ kind: z.literal("suspended"), payload: z.object({ expiresAt: z.iso.datetime() }) }),
  z.object({ kind: z.literal("domain-warning"), payload: z.object({ hostname: z.string().min(1).max(253), reason: z.string().min(1).max(2000) }) }),
]);

export function createEmailNotifier(db: PlatformDb, send: MailSender, repository = forTenant): Notifier {
  return { async send({ tenantId, kind, payload, idempotencyKey }) {
    const parsed = notificationSchema.safeParse({ kind, payload });
    if (!parsed.success) throw new PermanentError("Notification: loại hoặc payload không hợp lệ");
    const owners = await repository(db, tenantId).siteUser.list({
      where: { role: "owner", status: { not: "disabled" }, email: { not: null } },
      select: { id: true, email: true, tenant: { select: { name: true } } }, orderBy: { id: "asc" },
    });
    let sent = 0;
    for (const owner of owners) {
      if (!owner.email) continue;
      const mail = notifyMail(parsed.data.kind, parsed.data.payload, owner.tenant.name)!;
      try {
        await send({ to: owner.email, ...mail }, `${idempotencyKey}:${owner.id}`);
        sent++;
      } catch (error) {
        if (error instanceof ChannelError && error.permanent) throw new PermanentError(error.message);
        throw error;
      }
    }
    if (!sent) console.log("[notify] không có owner nhận email", { tenantId, kind, idempotencyKey, owners: owners.length });
  } };
}
