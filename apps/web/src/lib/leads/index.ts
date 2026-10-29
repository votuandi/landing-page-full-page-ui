import { randomUUID } from "node:crypto";
import { sendLead, sendWebhook, type ChannelConfig, type Lead } from "@solar/leads";
export type { Lead } from "@solar/leads";

/** Legacy single-site mode; tenant mode persists encrypted configs and uses the outbox. */
export async function dispatchLead(lead: Lead) {
  const env = process.env, wanted = (env.LEAD_ADAPTERS || "").split(",").map(s => s.trim()).filter(Boolean);
  const configs: { name: string; config: ChannelConfig }[] = [];
  if (env.LEAD_WEBHOOK_URL) configs.push({ name: "webhook", config: { kind: "webhook", url: env.LEAD_WEBHOOK_URL, secret: env.LEAD_WEBHOOK_TOKEN || "" } });
  if (env.GOOGLE_SHEETS_WEBAPP_URL) configs.push({ name: "google-sheets", config: { kind: "google_sheets", url: env.GOOGLE_SHEETS_WEBAPP_URL, secret: env.GOOGLE_SHEETS_SECRET || "" } });
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) configs.push({ name: "telegram", config: { kind: "telegram", chatId: env.TELEGRAM_CHAT_ID } });
  const active = configs.filter(c => !wanted.length || wanted.includes(c.name));
  if (!active.length) return { mode: "demo" as const, delivered: [] as string[] };
  const key = randomUUID(), results = await Promise.allSettled(active.map(c => c.config.kind === "webhook"
    ? sendWebhook(lead, c.config, key, undefined, env.LEAD_WEBHOOK_TOKEN)
    : sendLead(lead, c.config, key, env)));
  const delivered = active.filter((_, index) => results[index].status === "fulfilled").map(c => c.name);
  if (!delivered.length) throw new Error("Không gửi được lead tới adapter nào");
  return { mode: "live" as const, delivered };
}
