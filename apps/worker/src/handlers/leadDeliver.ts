import { z } from "zod";
import { forTenant, type Db, type OutboxJob, type PlatformDb } from "@solar/db";
import { PermanentError } from "../loop.ts";
import { ChannelError, type LeadSender, type ChannelKind, type EmailSender } from "@solar/leads";
export type { LeadSender } from "@solar/leads";

type TenantRepo = ReturnType<typeof forTenant>;
export type DeliveryLead = NonNullable<Awaited<ReturnType<TenantRepo["lead"]["get"]>>>;
export type DeliveryIntegration = NonNullable<Awaited<ReturnType<TenantRepo["leadIntegration"]["get"]>>>;
export type LeadSenders = Partial<Record<ChannelKind, LeadSender>>;

const payloadSchema = z.object({ leadId: z.uuid(), integrationId: z.uuid() });

/** `lead.deliver`: one job per lead × channel; malformed configs and permanent provider failures go dead. */
export function createLeadDeliver({ db, senders, repository = forTenant, senderFor = async () => null }: {
  db: Db | PlatformDb; senders: LeadSenders; repository?: typeof forTenant;
  senderFor?: (tenantId: string) => Promise<EmailSender | null>;
}) {
  return async (job: OutboxJob) => {
    const payload = payloadSchema.safeParse(job.payload);
    if (!job.tenantId || !payload.success) throw new PermanentError("lead.deliver: payload không hợp lệ");
    const { leadId, integrationId } = payload.data;
    const repo = repository(db, job.tenantId);
    const [lead, integration] = await Promise.all([repo.lead.get(leadId), repo.leadIntegration.get(integrationId)]);
    // Also covers a privacy deletion racing a claimed job: deleteLead removed the row, so going dead is a no-op there,
    // while forged cross-tenant jobs keep their dead audit (E11-S01).
    if (!lead || !integration) throw new PermanentError("lead.deliver: lead hoặc kênh nhận không còn tồn tại");
    // Channel turned off after the lead arrived: nothing to send.
    if (!integration.enabled) return;
    const sender = senders[integration.kind];
    if (!sender) throw new PermanentError(`lead.deliver: chưa hỗ trợ kênh ${integration.kind}`);
    try {
      const emailSender = integration.kind === "email" ? await senderFor(job.tenantId) : null;
      await sender.send({ lead, integration, idempotencyKey: `${leadId}:${integrationId}`, sender: emailSender });
    }
    catch (error) {
      if (error instanceof ChannelError && error.permanent) throw new PermanentError(error.message);
      throw error;
    }
  };
}
