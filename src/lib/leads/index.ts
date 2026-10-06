import { googleSheetsAdapter } from "./googleSheets";
import { telegramAdapter } from "./telegram";
import { webhookAdapter } from "./webhook";
import type { Lead } from "./types";

export type { Lead } from "./types";

const ALL = [webhookAdapter, googleSheetsAdapter, telegramAdapter];

/**
 * Gửi lead tới các adapter đang bật. LEAD_ADAPTERS="webhook,telegram" để chọn cụ thể;
 * bỏ trống = mọi adapter đã đủ biến môi trường. Không có adapter nào → chế độ demo (không gửi đi đâu).
 */
export async function dispatchLead(lead: Lead) {
  const wanted = (process.env.LEAD_ADAPTERS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const adapters = ALL.filter((a) => (wanted.length ? wanted.includes(a.name) : true) && a.enabled());
  if (!adapters.length) return { mode: "demo" as const, delivered: [] as string[] };
  const results = await Promise.allSettled(adapters.map((a) => a.send(lead)));
  results.forEach((r, i) => { if (r.status === "rejected") console.error(`[lead] ${adapters[i].name} lỗi:`, r.reason); });
  const delivered = adapters.filter((_, i) => results[i].status === "fulfilled").map((a) => a.name);
  if (!delivered.length) throw new Error("Không gửi được lead tới adapter nào");
  return { mode: "live" as const, delivered };
}
