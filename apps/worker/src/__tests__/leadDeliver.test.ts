import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { createLeadSenders, ChannelError, sealConfig } from "@solar/leads";
import { createLeadDeliver } from "../handlers/leadDeliver.ts";
import { PermanentError, runOnce } from "../loop.ts";
import { forTenant, type Db, type OutboxJob } from "@solar/db";

const keys = Buffer.alloc(32, 7).toString("base64");
const tenantId = randomUUID(), integrationId = randomUUID(), leadId = randomUUID();
const lead = { id: leadId, tenantId, name: "[DỮ LIỆU MẪU]", phone: "0901234567", source: "contact", data: {}, createdAt: new Date() };
const config = sealConfig({ kind: "telegram", chatId: "-1001234" }, keys, { tenantId, integrationId });
const integration = { id: integrationId, tenantId, kind: "telegram", configEncrypted: config, enabled: true };
const job = { tenantId, payload: { leadId, integrationId } } as OutboxJob;
// The repository still checks tenant id on every lookup; fake only the Prisma I/O boundary.
const db = {} as Db;
const repository = (() => ({ lead: { get: async () => lead }, leadIntegration: { get: async () => integration } })) as unknown as typeof forTenant;

test("chọn sender lúc gửi chỉ cho email; hạ gói dùng nền tảng; fallback lỗi tạm thời còn retry", async () => {
  let lookups = 0;
  const email = { ...integration, kind: "email" };
  const emailRepo = (() => ({ lead: { get: async () => lead }, leadIntegration: { get: async () => email } })) as unknown as typeof forTenant;
  const sender = { hostname: "mail.tenant.vn", from: "no-reply@mail.tenant.vn" };
  let allowed = true;
  const seen: unknown[] = [];
  const senderFor = async (tenant: string) => { assert.equal(tenant, tenantId); lookups++; return allowed ? sender : null; };
  const handle = createLeadDeliver({ db, repository: emailRepo, senderFor, senders: { email: { supportsIdempotency: true, send: async input => { seen.push(input.sender); } } } });
  await handle(job); allowed = false; await handle(job);
  assert.deepEqual(seen, [sender, null]); assert.equal(lookups, 2);
  await createLeadDeliver({ db, repository, senderFor, senders: { telegram: { supportsIdempotency: false, send: async () => {} } } })(job);
  assert.equal(lookups, 2);
  const keys = Buffer.alloc(32, 7).toString("base64");
  const encrypted = sealConfig({ kind: "email", to: ["a@x.vn"] }, keys, { tenantId, integrationId });
  email.configEncrypted = encrypted;
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => new Response(null, { status: ++requests % 2 ? 403 : 503 });
  try {
    const retry = createLeadDeliver({ db, repository: emailRepo, senderFor: async () => sender,
      senders: createLeadSenders({ APP_ENCRYPTION_KEY: keys, RESEND_API_KEY: "key", MAIL_FROM: "platform@x.vn" }) });
    await assert.rejects(retry(job), error => error instanceof ChannelError && !error.permanent);
    assert.equal(requests, 2);
  } finally { globalThis.fetch = originalFetch; }
});

test("lead missing (deleted or forged cross-tenant): never sends, goes dead — a no-op when deletion removed the row", async () => {
  let sent = false, dead = false;
  const missing = (() => ({ lead: { get: async () => null }, leadIntegration: { get: async () => integration } })) as unknown as typeof forTenant;
  const handle = createLeadDeliver({ db, repository: missing, senders: { telegram: { supportsIdempotency: false, send: async () => { sent = true; } } } });
  await runOnce({ topics: { "lead.deliver": { handle } }, outbox: {
    claim: async () => [{ ...job, topic: "lead.deliver" }],
    complete: async () => { assert.fail("a missing lead must not complete silently: forged jobs need the dead audit (E11-S01)"); },
    // deleteLead removes the row in its transaction, so the real fail() updates 0 rows and writes no audit.
    fail: async (_job, _error, options) => { dead = options?.dead === true; return "dead" as const; },
  } });
  assert.equal(sent, false); assert.equal(dead, true);
});
test("worker config hỏng → dead; lỗi retry giữ nguyên", async () => {
  for (const [error, permanent] of [[new ChannelError("Cấu hình kênh không hợp lệ", true), true], [new ChannelError("500"), false]] as const) {
    const handle = createLeadDeliver({ db, repository, senders: { telegram: { supportsIdempotency: false, send: async () => { throw error; } } } });
    await assert.rejects(handle(job), e => permanent ? e instanceof PermanentError : e === error);
  }
});
test("senders thật giải mã AAD, config sai và email chưa hỗ trợ trong deploy cũ", async () => {
  const senders = createLeadSenders({ APP_ENCRYPTION_KEY: keys });
  assert.equal(senders.email.supportsIdempotency, true); assert.equal(senders.telegram.supportsIdempotency, false);
  await assert.rejects(senders.telegram.send({ lead, integration: { ...integration, configEncrypted: "broken" }, idempotencyKey: "key" }), /Bí mật không hợp lệ/);
  await assert.rejects(senders.telegram.send({ lead, integration: { ...integration, id: randomUUID() }, idempotencyKey: "key" }), /Bí mật không hợp lệ/);
  const original = integration.kind;
  integration.kind = "email";
  try { await assert.rejects(createLeadDeliver({ db, repository, senders: {} })(job), /chưa hỗ trợ kênh email/); }
  finally { integration.kind = original; }
});
test("worker config legacy không hợp lệ là permanent; thiếu env nền tảng là retry", async () => {
  const senders = createLeadSenders({ APP_ENCRYPTION_KEY: keys });
  await assert.rejects(senders.telegram.send({ lead, integration, idempotencyKey: "key" }), e => e instanceof ChannelError && !e.permanent && /Nền tảng chưa cấu hình/.test(e.message));
  const { encryptSecret } = await import("@solar/env/secrets");
  const bad = encryptSecret(JSON.stringify({ kind: "telegram", chatId: "invalid" }), keys, { tenantId, integrationId });
  await assert.rejects(senders.telegram.send({ lead, integration: { ...integration, configEncrypted: bad }, idempotencyKey: "key" }), e => e instanceof ChannelError && e.permanent && /Cấu hình kênh không hợp lệ/.test(e.message));
});
