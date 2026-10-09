import type { LeadAdapter } from "./types";

/** Webhook chung (Zapier, Make, n8n, CRM…): POST JSON tới LEAD_WEBHOOK_URL. */
export const webhookAdapter: LeadAdapter = {
  name: "webhook",
  enabled: () => Boolean(process.env.LEAD_WEBHOOK_URL),
  async send(lead) {
    const res = await fetch(process.env.LEAD_WEBHOOK_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.LEAD_WEBHOOK_TOKEN ? { Authorization: `Bearer ${process.env.LEAD_WEBHOOK_TOKEN}` } : {}),
      },
      body: JSON.stringify(lead),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`webhook ${res.status}`);
  },
};
