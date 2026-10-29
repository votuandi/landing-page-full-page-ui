import { createHmac } from "node:crypto";
import { safeRequest, type SafeTransport } from "../safeRequest.ts";
import { checkStatus } from "../errors.ts";
import type { Lead } from "../types.ts";
import type { ChannelConfig } from "../config.ts";
export async function sendWebhook(lead: Lead, config: Extract<ChannelConfig, { kind: "webhook" }>, key: string, request: SafeTransport = safeRequest, legacyBearer?: string) {
  const body = JSON.stringify(lead), timestamp = Math.floor(Date.now() / 1000).toString();
  const response = await request(config.url, { method: "POST", body, headers: {
    "Content-Type": "application/json", "X-Solar-Timestamp": timestamp,
    ...(legacyBearer ? { Authorization: `Bearer ${legacyBearer}` } : {}),
    "X-Solar-Signature": `sha256=${createHmac("sha256", config.secret).update(`${timestamp}.${body}`).digest("hex")}`,
    "X-Solar-Idempotency-Key": key,
  } });
  checkStatus(response.status, "Webhook");
}
