import type { LeadAdapter } from "./types";

/**
 * Google Sheet qua Apps Script Web App (script mẫu: scripts/lead-google-apps-script.gs).
 * GOOGLE_SHEETS_WEBAPP_URL = URL ".../exec" sau khi triển khai; GOOGLE_SHEETS_SECRET = khóa khớp với script.
 */
export const googleSheetsAdapter: LeadAdapter = {
  name: "google-sheets",
  enabled: () => Boolean(process.env.GOOGLE_SHEETS_WEBAPP_URL),
  async send(lead) {
    const res = await fetch(process.env.GOOGLE_SHEETS_WEBAPP_URL!, {
      method: "POST",
      // Apps Script không xử lý preflight → gửi text/plain, script tự JSON.parse
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ secret: process.env.GOOGLE_SHEETS_SECRET || "", ...lead, estimate: lead.estimate ? JSON.stringify(lead.estimate) : "", items: lead.items?.map((i) => `${i.name} × ${i.qty}`).join("; ") || "" }),
      redirect: "follow",
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`google-sheets ${res.status}`);
  },
};
