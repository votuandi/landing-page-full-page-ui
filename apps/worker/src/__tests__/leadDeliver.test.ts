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

test("lead deleted: claimed job completes without sending or failing", async () => {
  let sent = false, completed = false;
  const missing = (() => ({ lead: { get: async () => null }, leadIntegration: { get: async () => integration } })) as unknown as typeof forTenant;
  const handle = createLeadDeliver({ db, repository: missing, senders: { telegram: { supportsIdempotency: false, send: async () => { sent = true; } } } });
  await runOnce({ topics: { "lead.deliver": { handle } }, outbox: {
    claim: async () => [{ ...job, topic: "lead.deliver" }],
    complete: async () => { completed = true; return false; }, // deletion already removed the outbox row
    fail: async () => { assert.fail("a deleted lead must not retry"); },
  } });
  assert.equal(sent, false); assert.equal(completed, true);
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
