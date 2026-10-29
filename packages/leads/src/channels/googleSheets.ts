import { safeRequest, type SafeTransport } from "../safeRequest.ts";
import { checkStatus, ChannelError } from "../errors.ts";
import type { Lead } from "../types.ts";
import type { ChannelConfig } from "../config.ts";
export async function sendGoogleSheets(lead: Lead, config: Extract<ChannelConfig, { kind: "google_sheets" }>, key: string, request: SafeTransport = safeRequest) {
  let response = await request(config.url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({
    ...lead, secret: config.secret, id: key, estimate: lead.estimate ? JSON.stringify(lead.estimate) : "", items: lead.items?.map(i => `${i.name} × ${i.qty}`).join("; ") || "",
  }) }, { allowRedirectHosts: ["script.googleusercontent.com"] });
  if (response.status >= 300 && response.status < 400) {
    let target: URL;
    try { target = new URL(response.headers.location ?? ""); } catch { throw new ChannelError("Sheets trả chuyển hướng không hợp lệ", true); }
    if (response.status !== 302 || target.protocol !== "https:" || target.hostname !== "script.googleusercontent.com" || target.port || target.username || target.password) throw new ChannelError("Sheets trả chuyển hướng không được phép", true);
    response = await request(target.href, { method: "GET" });
    if (response.status >= 300 && response.status < 400) throw new ChannelError("Sheets chuyển hướng quá một lần", true);
  }
  checkStatus(response.status, "Google Sheets");
  // Apps Script cannot set an HTTP error status; the sample reports wrong secrets in JSON.
  let result: unknown;
  try { result = JSON.parse(response.body); } catch { throw new ChannelError("Google Sheets: phản hồi không hợp lệ"); }
  if (!result || typeof result !== "object" || !("ok" in result) || result.ok !== true) throw new ChannelError("Google Sheets từ chối lead. Vui lòng kiểm tra khóa bí mật và Apps Script.", true);
}
