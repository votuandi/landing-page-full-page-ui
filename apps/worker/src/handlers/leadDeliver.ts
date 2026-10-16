import { z } from "zod";
import { forTenant, type Db, type OutboxJob, type PlatformDb } from "@solar/db";
import { PermanentError } from "../loop.ts";

type TenantRepo = ReturnType<typeof forTenant>;
export type DeliveryLead = NonNullable<Awaited<ReturnType<TenantRepo["lead"]["get"]>>>;
export type DeliveryIntegration = NonNullable<Awaited<ReturnType<TenantRepo["leadIntegration"]["get"]>>>;
export type LeadSender = {
  /** true: the channel drops repeats of `idempotencyKey` → exactly once. false: a retry after a crash may repeat (at least once). */
  supportsIdempotency: boolean;
  send(input: { lead: DeliveryLead; integration: DeliveryIntegration; idempotencyKey: string }): Promise<void>;
};
export type LeadSenders = Partial<Record<DeliveryIntegration["kind"], LeadSender>>;

const payloadSchema = z.object({ leadId: z.uuid(), integrationId: z.uuid() });

/** `lead.deliver`: one job per lead × channel. Real senders (decrypting the channel config) arrive in E11-S02. */
export function createLeadDeliver({ db, senders }: { db: Db | PlatformDb; senders: LeadSenders }) {
  return async (job: OutboxJob) => {
    const payload = payloadSchema.safeParse(job.payload);
    if (!job.tenantId || !payload.success) throw new PermanentError("lead.deliver: payload không hợp lệ");
    const { leadId, integrationId } = payload.data;
    const repo = forTenant(db, job.tenantId);
    const [lead, integration] = await Promise.all([repo.lead.get(leadId), repo.leadIntegration.get(integrationId)]);
    if (!lead || !integration) throw new PermanentError("lead.deliver: lead hoặc kênh nhận không còn tồn tại");
    // Channel turned off after the lead arrived: nothing to send.
    if (!integration.enabled) return;
    const sender = senders[integration.kind];
    if (!sender) throw new PermanentError(`lead.deliver: chưa hỗ trợ kênh ${integration.kind}`);
    await sender.send({ lead, integration, idempotencyKey: `${leadId}:${integrationId}` });
  };
}
