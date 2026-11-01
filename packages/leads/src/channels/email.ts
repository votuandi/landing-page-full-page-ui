import { sendMail, type MailEnv } from "../mail.ts";
import { leadToText, type Lead } from "../types.ts";
import type { ChannelConfig } from "../config.ts";
import { ChannelError } from "../errors.ts";
import type { EmailSender } from "../senderDomains.ts";
export type EmailEnv = MailEnv & { LEAD_EMAIL_FROM?: string };
export async function sendEmail(lead: Lead, config: Extract<ChannelConfig, { kind: "email" }>, key: string, env: EmailEnv, fetcher = fetch, sender?: EmailSender | null) {
  const mail = { to: config.to, subject: "Lead mới từ website", text: leadToText(lead) };
  if (sender) {
    try { await sendMail({ ...mail, from: sender.from }, `${key}:${sender.hostname}`, env, fetcher); return; }
    catch (error) {
      if (!(error instanceof ChannelError) || !error.permanent) throw error;
      if (error.status === 403) {
        try { await sender.onRejected?.(); } catch { /* A demotion failure must not prevent the platform fallback. */ }
      }
    }
  }
  await sendMail({ ...mail, from: env.LEAD_EMAIL_FROM || undefined }, key, env, fetcher);
}
