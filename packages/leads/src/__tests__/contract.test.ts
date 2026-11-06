import assert from "node:assert/strict";
import test from "node:test";
import { sendEmail } from "../channels/email.ts";
import { sendTelegram } from "../channels/telegram.ts";
import { sendWebhook } from "../channels/webhook.ts";
import { sendGoogleSheets } from "../channels/googleSheets.ts";
import { ChannelError } from "../errors.ts";
import type { SafeTransport } from "../safeRequest.ts";

const lead = { name: "[DỮ LIỆU MẪU]", phone: "0901234570", source: "contact", submittedAt: "2026-11-06T00:00:00Z" };
const secret = "contract-secret-token";
const url = "https://example.com/private-hook";

function channels(status: number, networkError?: Error) {
  const failNetwork = () => { if (networkError) throw networkError; };
  const fetcher: typeof fetch = async () => {
    failNetwork();
    return new Response('{"ok":true}', { status });
  };
  const request: SafeTransport = async () => {
    failNetwork();
    return { status, body: '{"ok":true}', headers: {} };
  };
  return [
    ["email", () => sendEmail(lead, { kind: "email", to: ["owner@example.vn"] }, "contract-id", { RESEND_API_KEY: secret, MAIL_FROM: "platform@example.vn" }, fetcher)],
    ["telegram", () => sendTelegram(lead, { kind: "telegram", chatId: "123" }, { TELEGRAM_BOT_TOKEN: secret }, fetcher)],
    ["webhook", () => sendWebhook(lead, { kind: "webhook", url, secret }, "contract-id", request)],
    ["google_sheets", () => sendGoogleSheets(lead, { kind: "google_sheets", url: "https://script.google.com/macros/s/contract/exec", secret }, "contract-id", request)],
  ] as const;
}

for (const status of [200, 201, 400, 401, 403, 404, 408, 422, 429, 500, 503]) {
  for (const [name, send] of channels(status)) {
    test(`contract ${name}: HTTP ${status}`, async () => {
      if (status < 300) { await send(); return; }
      await assert.rejects(send(), (error: unknown) => {
        assert.ok(error instanceof ChannelError);
        assert.equal(error.permanent, status < 500 && ![408, 429].includes(status));
        assert.ok(!error.message.includes(secret));
        assert.doesNotMatch(error.message, /https?:\/\//);
        return true;
      });
    });
  }
}

for (const networkError of [new TypeError("fetch failed"), new ChannelError("Không kết nối được kênh")]) {
  for (const [name, send] of channels(200, networkError)) {
    test(`contract ${name}: ${networkError.constructor.name} mạng tạm thời, không lộ URL/token`, async () => {
      await assert.rejects(send(), (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.ok(!("permanent" in error && error.permanent === true));
        assert.ok(!error.message.includes(secret));
        assert.doesNotMatch(error.message, /https?:\/\//);
        return true;
      });
    });
  }
}
