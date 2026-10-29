import { checkStatus, ChannelError } from "../errors.ts";
import { leadToText, type Lead } from "../types.ts";
import type { ChannelConfig } from "../config.ts";
export type EmailEnv = { RESEND_API_KEY?: string; LEAD_EMAIL_FROM?: string };
export async function sendEmail(lead: Lead, config: Extract<ChannelConfig, { kind: "email" }>, key: string, env: EmailEnv, fetcher = fetch) {
  if (!env.RESEND_API_KEY || !env.LEAD_EMAIL_FROM) throw new ChannelError("Nền tảng chưa cấu hình email (RESEND_API_KEY / LEAD_EMAIL_FROM)");
  const response = await fetcher("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": key },
    body: JSON.stringify({ from: env.LEAD_EMAIL_FROM, to: config.to, subject: "Lead mới từ website", text: leadToText(lead) }),
    signal: AbortSignal.timeout(10_000), redirect: "error",
  });
  await response.body?.cancel(); checkStatus(response.status, "Email");
}
