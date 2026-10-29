import { checkStatus, ChannelError } from "../errors.ts";
import { leadToText, type Lead } from "../types.ts";
import type { ChannelConfig } from "../config.ts";
export async function sendTelegram(lead: Lead, config: Extract<ChannelConfig, { kind: "telegram" }>, env: { TELEGRAM_BOT_TOKEN?: string }, fetcher = fetch) {
  if (!env.TELEGRAM_BOT_TOKEN) throw new ChannelError("Nền tảng chưa cấu hình Telegram (TELEGRAM_BOT_TOKEN)");
  const response = await fetcher(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: config.chatId, text: leadToText(lead), disable_web_page_preview: true }),
    signal: AbortSignal.timeout(10_000), redirect: "error",
  });
  await response.body?.cancel(); checkStatus(response.status, "Telegram");
}
