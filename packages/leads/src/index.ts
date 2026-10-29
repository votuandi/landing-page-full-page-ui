import { randomUUID } from "node:crypto";
import { openConfig, type ChannelConfig, type ChannelKind } from "./config.ts";
import { ChannelError } from "./errors.ts";
import { leadFromRow, type Lead, type LeadRow } from "./types.ts";
import { sendEmail, type EmailEnv } from "./channels/email.ts";
import { sendTelegram } from "./channels/telegram.ts";
import { sendWebhook } from "./channels/webhook.ts";
import { sendGoogleSheets } from "./channels/googleSheets.ts";
export * from "./types.ts";
export * from "./config.ts";
export * from "./safeRequest.ts";
export { ChannelError } from "./errors.ts";
export { sendWebhook } from "./channels/webhook.ts";

export type LeadEnv = EmailEnv & { TELEGRAM_BOT_TOKEN?: string; APP_ENCRYPTION_KEY?: string; [key: string]: string | undefined };
export async function sendLead(lead: Lead, config: ChannelConfig, key: string, env: LeadEnv) {
  try {
    switch (config.kind) {
      case "email": return await sendEmail(lead, config, key, env);
      case "telegram": return await sendTelegram(lead, config, env);
      case "webhook": return await sendWebhook(lead, config, key);
      case "google_sheets": return await sendGoogleSheets(lead, config, key);
    }
  } catch (error) {
    if (error instanceof ChannelError) throw error;
    // Never persist URLs, API tokens, or provider response bodies in outbox errors.
    throw new ChannelError("Không kết nối được dịch vụ nhận lead. Vui lòng thử lại.");
  }
}
export type LeadSender = {
  supportsIdempotency: boolean;
  send(input: { lead: LeadRow; integration: { id: string; tenantId: string; kind: string; configEncrypted: string }; idempotencyKey: string }): Promise<void>;
};
export function createLeadSenders(env: LeadEnv): Record<ChannelKind, LeadSender> {
  return Object.fromEntries((["email", "telegram", "webhook", "google_sheets"] as const).map(kind => [kind, {
    supportsIdempotency: kind === "email",
    async send({ lead, integration, idempotencyKey }: Parameters<LeadSender["send"]>[0]) {
      if (!env.APP_ENCRYPTION_KEY) throw new ChannelError("Nền tảng chưa cấu hình APP_ENCRYPTION_KEY");
      const config = openConfig(integration.configEncrypted, env.APP_ENCRYPTION_KEY, { tenantId: integration.tenantId, integrationId: integration.id });
      if (config.kind !== integration.kind) throw new ChannelError("Cấu hình kênh không hợp lệ", true);
      await sendLead(leadFromRow(lead), config, idempotencyKey, env);
    },
  }])) as Record<ChannelKind, LeadSender>;
}
export function sendTest(config: ChannelConfig, env: LeadEnv) {
  return sendLead({ name: "[DỮ LIỆU MẪU] Gửi thử kênh nhận lead", phone: "0901234567", source: "test", submittedAt: new Date().toISOString() }, config, `test:${randomUUID()}`, env);
}
