import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import type { OutboxJob } from "@solar/db";
import type { StorageDriver } from "@solar/storage";
import { createMediaPublish, cleanupExpiredMedia } from "../handlers/mediaPublish.ts";
import { PermanentError } from "../loop.ts";

test("media.publish: ready private to public, stable target across retries, quarantine cron cleanup", async () => {
  const tenantId = randomUUID(), id = randomUUID();
  const row = { id, tenantId, key: `private/${tenantId}/2026/10/${id}.pdf`, status: "ready", visibility: "private", mime: "application/pdf", size: 8 };
  const old = row.key, target = old.replace(/^private\//, "tenants/");
  const files = new Map<string, Uint8Array>([[old, Buffer.from("%PDF-1.7")]]);
  const storage = { get: async (k: string) => files.get(k) ?? null, put: async (k: string, b: Buffer) => { files.set(k, b); }, delete: async (k: string) => { files.delete(k); } } as unknown as StorageDriver;
  const media = { get: async () => row, publish: async (_tenant: string, _id: string, key: string) => { row.key = key; row.visibility = "public"; return true; } };
  const handle = createMediaPublish({ media, storage });
  const job: OutboxJob = { id: randomUUID(), tenantId, topic: "media.publish", payload: { tenantId, id }, idempotencyKey: `media.publish:${id}`, attempts: 1, createdAt: new Date(), runAt: new Date() };
  await handle(job); assert.equal(row.key, target); assert.equal(row.visibility, "public");
  assert.deepEqual([...files.keys()], [target]);
  await handle(job); assert.deepEqual([...files.keys()], [target]);
  files.set(`quarantine/${tenantId}/old`, Buffer.from("x"));
  await cleanupExpiredMedia({ expireStale: async () => [{ tenantId, key: `quarantine/${tenantId}/old` }], storage });
  assert.equal(files.size, 1);
});

test("I2: quarantine publish is retryable; failed media is a completed no-op", async () => {
  const tenantId = randomUUID(), id = randomUUID();
  const row = { id, tenantId, key: `quarantine/${tenantId}/${id}`, status: "quarantine", visibility: "private", mime: "application/pdf", size: 8 };
  const storage = { get: async () => { throw Error("must not read quarantine or failed content"); } } as unknown as StorageDriver;
  const handle = createMediaPublish({ media: { get: async () => row, publish: async () => false }, storage });
  const job: OutboxJob = { id: randomUUID(), tenantId, topic: "media.publish", payload: { tenantId, id }, idempotencyKey: `media.publish:${id}`, attempts: 1, createdAt: new Date(), runAt: new Date() };
  await assert.rejects(handle(job), error => error instanceof Error && !(error instanceof PermanentError));
  row.status = "failed"; await handle(job);
});
