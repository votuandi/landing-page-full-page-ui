import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import type { OutboxJob } from "@solar/db";
import { createNotify } from "../handlers/notify.ts";
import { PermanentError } from "../loop.ts";

test("notify routes tenant/kind/payload and stable idempotency key; rejects malformed or cross-tenant jobs", async () => {
  const tenantId = randomUUID();
  const job: OutboxJob = { id: "job", tenantId, topic: "notify.plan-changed", payload: { tenantId, from: "pro", to: "basic" },
    idempotencyKey: "notify.plan-changed:audit", attempts: 1, createdAt: new Date(), runAt: new Date() };
  const sent: unknown[] = [];
  const handle = createNotify({ notifier: { send: async input => { sent.push(input); } } });
  await handle(job);
  assert.deepEqual(sent, [{ tenantId, kind: "plan-changed", payload: job.payload, idempotencyKey: job.idempotencyKey }]);
  for (const invalid of [{ ...job, payload: {} }, { ...job, payload: { tenantId: randomUUID() } }, { ...job, tenantId: null }, { ...job, topic: "lead.deliver" }]) {
    await assert.rejects(handle(invalid), PermanentError);
  }
  assert.equal(sent.length, 1);
  await assert.rejects(createNotify({ notifier: { send: async () => { throw Error("offline"); } } })(job), /offline/);
});

test("billing notifications preserve renewal milestone, expiry, tenant and deduplication key", async () => {
  const tenantId = randomUUID(), expiresAt = "2040-01-15T12:00:00.000Z";
  const sent: unknown[] = [];
  const handle = createNotify({ notifier: { send: async input => { sent.push(input); } } });
  for (const [kind, payload, key] of [
    ["renewal", { tenantId, days: 7, expiresAt }, `renewal:${tenantId}:${expiresAt}:7`],
    ["suspended", { tenantId, expiresAt }, `suspended:${tenantId}:${expiresAt}`],
  ] as const) {
    await handle({ id: randomUUID(), tenantId, topic: `notify.${kind}`, payload, idempotencyKey: key,
      attempts: 1, createdAt: new Date(), runAt: new Date() });
    assert.deepEqual(sent.at(-1), { tenantId, kind, payload, idempotencyKey: key });
  }
  assert.equal(sent.length, 2);
});
