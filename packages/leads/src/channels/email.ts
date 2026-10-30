import { sendMail, type MailEnv } from "../mail.ts";
import { leadToText, type Lead } from "../types.ts";
import type { ChannelConfig } from "../config.ts";
export type EmailEnv = MailEnv & { LEAD_EMAIL_FROM?: string };
export async function sendEmail(lead: Lead, config: Extract<ChannelConfig, { kind: "email" }>, key: string, env: EmailEnv, fetcher = fetch) {
  await sendMail({ from: env.LEAD_EMAIL_FROM || undefined, to: config.to, subject: "Lead mới từ website", text: leadToText(lead) }, key, env, fetcher);
}
