import { leadToText, type LeadAdapter } from "./types";

/** Telegram bot: tạo bot qua @BotFather → TELEGRAM_BOT_TOKEN; TELEGRAM_CHAT_ID = id nhóm/người nhận. */
export const telegramAdapter: LeadAdapter = {
  name: "telegram",
  enabled: () => Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
  async send(lead) {
    const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: leadToText(lead), disable_web_page_preview: true }),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`telegram ${res.status}`);
  },
};
