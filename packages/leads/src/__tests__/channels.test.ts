import assert from "node:assert/strict";
import test from "node:test";
import { createHmac } from "node:crypto";
import { sendEmail } from "../channels/email.ts";
import { sendTelegram } from "../channels/telegram.ts";
import { sendWebhook } from "../channels/webhook.ts";
import { sendGoogleSheets } from "../channels/googleSheets.ts";
import { leadToText, leadFromRow } from "../types.ts";
import { createLeadSenders, sendTest, sealConfig, type ChannelConfig } from "../index.ts";

const lead = { name: "<b>[DỮ LIỆU MẪU]</b>", phone: "0901234570", source: "contact", submittedAt: "2026-10-29T00:00:00Z" };
test("email falls back to MAIL_FROM and prefers LEAD_EMAIL_FROM", async () => {
  for (const override of [undefined, "", "lead@example.vn"]) {
    await sendEmail(lead, { kind: "email", to: ["owner@example.vn"] }, "key", {
      RESEND_API_KEY: "key", MAIL_FROM: "mail@example.vn", LEAD_EMAIL_FROM: override,
    }, async (_url, options) => {
      assert.equal(JSON.parse(String(options?.body)).from, override || "mail@example.vn");
      return new Response(null, { status: 200 });
    });
  }
});
test("leadToText và leadFromRow giữ nội dung", () => {
  assert.match(leadToText(lead), /Trang liên hệ/);
  assert.deepEqual(leadFromRow({ ...lead, data: { submittedAt: lead.submittedAt }, createdAt: new Date(lead.submittedAt) }), lead);
});

test("leadToText: nguồn lạ trùng thuộc tính prototype vẫn dùng nhãn nguồn nguyên văn", () => {
  for (const source of ["constructor", "toString", "__proto__", "custom-source"]) {
    assert.equal(leadToText({ ...lead, source }).split("\n")[0], `🔔 Lead mới — ${source}`);
  }
});

test("leadFromRow giữ mọi trường intake, bỏ field lạ và dùng createdAt nếu thiếu submittedAt", () => {
  const fields = { zalo: "0901234570", address: "Q1", province: "Đồng Nai", businessType: "Đại lý", page: "/gio-hang",
    estimate: { kWp: 5, storage: true, roof: "tôn" }, items: [{ sku: "p1", name: "Tấm pin", qty: 2 }] };
  const row = { ...lead, email: "a@x.vn", segment: "household", message: "Mái tôn", createdAt: new Date(lead.submittedAt), data: { ...fields, submittedAt: lead.submittedAt, tenantId: "forged" } };
  assert.deepEqual(leadFromRow(row), { ...lead, email: row.email, segment: row.segment, message: row.message, ...fields });
  assert.equal(leadFromRow({ ...row, data: fields }).submittedAt, row.createdAt.toISOString());
});

test("createLeadSenders: gửi thật email/Telegram đúng config AAD, dữ liệu row và idempotency", async t => {
  const env = { APP_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"), RESEND_API_KEY: "test-key", LEAD_EMAIL_FROM: "Solar <lead@x.vn>", TELEGRAM_BOT_TOKEN: "test-bot" };
  const calls: { url: string; headers: Headers; body: Record<string, unknown> }[] = [];
  t.mock.method(globalThis, "fetch", async (url: string, options: RequestInit) => {
    calls.push({ url, headers: new Headers(options.headers), body: JSON.parse(String(options.body)) });
    return new Response("{}", { status: 200 });
  });
  const senders = createLeadSenders(env), tenantId = "tenant-a", integrationId = "integration-a";
  for (const config of [{ kind: "email", to: ["a@x.vn"] }, { kind: "telegram", chatId: "-1001234" }] satisfies ChannelConfig[]) {
    await senders[config.kind].send({
      lead: { ...lead, createdAt: new Date(lead.submittedAt), data: { page: "/lien-he" } },
      integration: { id: integrationId, tenantId, kind: config.kind, configEncrypted: sealConfig(config, env.APP_ENCRYPTION_KEY, { tenantId, integrationId }) },
      idempotencyKey: "lead-a:integration-a",
    });
  }
  assert.equal(calls.length, 2); assert.equal(calls[0].url, "https://api.resend.com/emails");
  assert.deepEqual(calls[0].body.to, ["a@x.vn"]); assert.equal(calls[0].headers.get("Idempotency-Key"), "lead-a:integration-a");
  assert.equal(calls[1].url, "https://api.telegram.org/bottest-bot/sendMessage"); assert.equal(calls[1].body.chat_id, "-1001234");
  for (const call of calls) { assert.match(String(call.body.text), /<b>\[DỮ LIỆU MẪU\]<\/b>/); assert.match(String(call.body.text), /Trang: \/lien-he/); }
});

test("sendTest thành công gửi nhãn dữ liệu mẫu và key riêng mỗi lần, không tái dùng key lead thật", async t => {
  const bodies: string[] = [], keys: string[] = [];
  t.mock.method(globalThis, "fetch", async (_url: string, options: RequestInit) => {
    bodies.push(String(options.body)); keys.push(new Headers(options.headers).get("Idempotency-Key")!);
    return new Response("{}", { status: 200 });
  });
  for (let i = 0; i < 2; i++) await sendTest({ kind: "email", to: ["a@x.vn"] }, { RESEND_API_KEY: "test-key", LEAD_EMAIL_FROM: "lead@x.vn" });
  for (const body of bodies) assert.match(body, /\[DỮ LIỆU MẪU\]/);
  assert.equal(keys.length, 2); for (const key of keys) assert.match(key, /^test:/); assert.notEqual(keys[0], keys[1]);
});
test("email gửi qua Resend với idempotency key", async () => {
  const fetcher: typeof fetch = async (url, options) => {
    assert.equal(url, "https://api.resend.com/emails");
    assert.equal(new Headers(options?.headers).get("Idempotency-Key"), "lead:integration");
    const body = JSON.parse(String(options?.body));
    assert.deepEqual(body.to, ["a@x.vn"]); assert.match(body.text, /DỮ LIỆU MẪU/); assert.equal(body.html, undefined);
    return new Response("{}", { status: 200 });
  };
  await sendEmail(lead, { kind: "email", to: ["a@x.vn"] }, "lead:integration", { RESEND_API_KEY: "key", LEAD_EMAIL_FROM: "Solar <lead@x.vn>" }, fetcher);
});
test("telegram text thuần, 400/403 permanent, 429/5xx retry", async () => {
  for (const status of [200, 400, 403, 408, 429, 500]) {
    const send = () => sendTelegram(lead, { kind: "telegram", chatId: "-1001234" }, { TELEGRAM_BOT_TOKEN: "token" }, async (_url, options) => {
      const body = JSON.parse(String(options?.body)); assert.equal(body.parse_mode, undefined); assert.match(body.text, /<b>/);
      return new Response("{}", { status });
    });
    if (status === 200) await send();
    else await assert.rejects(send(), (error: unknown) => error instanceof Error && "permanent" in error && error.permanent === [400, 403].includes(status));
  }
});
test("chữ ký HMAC kiểm được", async () => {
  await sendWebhook(lead, { kind: "webhook", url: "https://example.com", secret: "secret" }, "lead:integration", async (_url, options) => {
    const headers = new Headers(options.headers), timestamp = headers.get("X-Solar-Timestamp");
    assert.equal(headers.get("X-Solar-Signature"), `sha256=${createHmac("sha256", "secret").update(`${timestamp}.${options.body}`).digest("hex")}`);
    assert.equal(headers.get("X-Solar-Idempotency-Key"), "lead:integration");
    return { status: 200, body: '{"ok":true}', headers: {} };
  });
});

test("single-site giữ Bearer token cũ bên cạnh chữ ký HMAC", async () => {
  await sendWebhook(lead, { kind: "webhook", url: "https://example.com", secret: "secret" }, "id", async (_url, options) => {
    assert.equal(options.headers?.Authorization, "Bearer legacy-token");
    return { status: 200, body: "ok", headers: {} };
  }, "legacy-token");
});
test("Sheets gửi text/plain secret/id, chỉ một redirect GET Google", async () => {
  let calls = 0;
  await sendGoogleSheets(lead, { kind: "google_sheets", url: "https://script.google.com/macros/s/demo/exec", secret: "s" }, "lead:integration", async (url, options) => {
    calls++;
    if (calls === 1) {
      assert.match(String(options.headers?.["Content-Type"]), /text\/plain/);
      assert.equal(JSON.parse(options.body!).id, "lead:integration");
      return { status: 302, body: "", headers: { location: "https://script.googleusercontent.com/macros/echo?id=1" } };
    }
    assert.equal(new URL(url).hostname, "script.googleusercontent.com"); assert.equal(options.method, "GET"); assert.equal(options.body, undefined);
    return { status: 200, body: '{"ok":true}', headers: {} };
  });
  assert.equal(calls, 2);
  await assert.rejects(sendGoogleSheets(lead, { kind: "google_sheets", url: "https://script.google.com/macros/s/demo/exec", secret: "s" }, "id", async () => ({ status: 302, body: "", headers: { location: "https://evil.example" } })), /chuyển hướng/);
});

test("Sheets HTTP 200 ok:false là lỗi cấu hình permanent; không báo gửi thành công", async () => {
  await assert.rejects(sendGoogleSheets(lead, { kind: "google_sheets", url: "https://script.google.com/macros/s/demo/exec", secret: "wrong" }, "id",
    async () => ({ status: 200, body: '{"ok":false}', headers: {} })), error => error instanceof Error && "permanent" in error && error.permanent === true);
});
