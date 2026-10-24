import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import sharp from "sharp";
import { createDb, createPlatformDb, forTenant, forPlatform, withTenantTransaction, publishMedia, reserveUpload, promoteMedia, rejectMedia, cancelUpload, mediaUsage, type OutboxJob } from "@solar/db";
import type { StorageDriver } from "@solar/storage";
import { createMediaScan } from "../handlers/mediaScan.ts";
import { createMediaPublish } from "../handlers/mediaPublish.ts";
import { runOnce } from "../loop.ts";

function memoryStorage() {
  const files = new Map<string, Uint8Array>();
  const storage: StorageDriver = {
    get: async key => files.get(key) ?? null, head: async key => files.has(key) ? { size: files.get(key)!.byteLength } : null,
    put: async (key, body) => { files.set(key, body); }, delete: async key => { files.delete(key); },
    publicUrl: key => key, list: async function* (prefix) { for (const key of files.keys()) if (key.startsWith(prefix)) yield key; },
  };
  return { files, storage };
}
const scanJob = (tenantId: string, id: string): OutboxJob => ({ id: randomUUID(), tenantId, topic: "media.scan", payload: { tenantId, id }, idempotencyKey: `media.scan:${id}`, attempts: 1, createdAt: new Date(), runAt: new Date() });

test("I1 DB scan: unpadded palette PNG grows to actual ready size; tight quota rejects with quota reason", { skip: !process.env.DATABASE_URL }, async () => {
  const db = createDb({ pool: 3 }), ops = createPlatformDb({ pool: 1 }), tenantId = randomUUID();
  const { files, storage } = memoryStorage();
  try {
    await ops.tenant.create({ data: { id: tenantId, slug: tenantId, name: "[DỮ LIỆU MẪU]", planId: "basic", status: "active" } });
    const repo = forTenant(db, tenantId);
    const media = { get: (tenant: string, id: string) => forTenant(db, tenant).media.get(id),
      promote: (tenant: string, id: string, data: Parameters<typeof promoteMedia>[3]) => promoteMedia(db, tenant, id, data),
      reject: (tenant: string, id: string, reason: string) => rejectMedia(db, tenant, id, reason) };
    const scan = createMediaScan({ media, storage });
    const input = await sharp({ create: { width: 32, height: 32, channels: 3, background: "red" } }).png({ palette: true }).toBuffer();
    const actual = (await sharp(input).rotate().toBuffer()).byteLength;
    assert.ok(actual > input.byteLength);
    const first = await reserveUpload(db, tenantId, { mime: "image/png", size: input.byteLength }, "local");
    files.set(first.key, input); await scan(scanJob(tenantId, first.id));
    const ready = (await repo.media.get(first.id))!;
    assert.equal(ready.status, "ready"); assert.equal(ready.size, actual); assert.equal(ready.size, files.get(ready.key)!.byteLength);
    await repo.media.delete(first.id);
    await repo.media.create({ key: `private/${tenantId}/used`, driver: "local", mime: "video/mp4", size: 1024 ** 3 - input.byteLength, status: "ready", visibility: "private" });
    const second = await reserveUpload(db, tenantId, { mime: "image/png", size: input.byteLength }, "local");
    files.set(second.key, input); await scan(scanJob(tenantId, second.id));
    assert.equal((await repo.media.get(second.id))?.status, "failed");
    assert.ok(await mediaUsage(repo) <= 1024 ** 3);
    const audit = await repo.auditLog.first({ where: { action: "media.rejected", entityId: second.id } });
    assert.match(JSON.stringify(audit?.data), /quota/i);
    assert.equal(await storage.get(second.key), null);
    assert.equal([...files.keys()].filter(key => key.startsWith("private/")).length, 1, "rejected output must be removed");
  } finally { await ops.tenant.deleteMany({ where: { id: tenantId } }); await Promise.all([db.$disconnect(), ops.$disconnect()]); }
});

test("DB scan/cancel race: cancel before promote cleans output; promote before cancel returns 404", { skip: !process.env.DATABASE_URL }, async () => {
  const db = createDb({ pool: 3 }), ops = createPlatformDb({ pool: 1 }), tenantId = randomUUID();
  const { files, storage } = memoryStorage();
  try {
    await ops.tenant.create({ data: { id: tenantId, slug: tenantId, name: "[DỮ LIỆU MẪU]", planId: "basic", status: "active" } });
    const repo = forTenant(db, tenantId);
    let promoted: boolean | undefined;
    const scan = createMediaScan({ storage, media: { get: (tenant, id) => forTenant(db, tenant).media.get(id),
      promote: async (tenant, id, data) => promoted = await promoteMedia(db, tenant, id, data),
      reject: (tenant, id, reason) => rejectMedia(db, tenant, id, reason) } });
    const first = await reserveUpload(db, tenantId, { mime: "application/pdf", size: 8 }, "local");
    files.set(first.key, Buffer.from("%PDF-1.7"));
    let release!: () => void, paused!: () => void;
    const resume = new Promise<void>(resolve => { release = resolve; }), written = new Promise<void>(resolve => { paused = resolve; });
    const originalPut = storage.put;
    storage.put = async (...args) => { await originalPut(...args); paused(); await resume; };
    const running = scan(scanJob(tenantId, first.id));
    try { await written; await cancelUpload(db, tenantId, first.id); } finally { release(); }
    await running;
    assert.equal(promoted, false); assert.equal(await repo.media.get(first.id), null); assert.equal(files.size, 0);
    storage.put = originalPut;
    const second = await reserveUpload(db, tenantId, { mime: "application/pdf", size: 8 }, "local");
    files.set(second.key, Buffer.from("%PDF-1.7")); await scan(scanJob(tenantId, second.id));
    assert.equal(promoted, true);
    await assert.rejects(cancelUpload(db, tenantId, second.id), { status: 404 });
    const ready = (await repo.media.get(second.id))!;
    assert.equal(ready.status, "ready"); assert.ok(files.has(ready.key));
    assert.ok([...files.keys()].every(key => key.startsWith(`private/${tenantId}/`)));
  } finally { await ops.tenant.deleteMany({ where: { id: tenantId } }); await Promise.all([db.$disconnect(), ops.$disconnect()]); }
});

test("I2 DB: publication waits for scan, retries to public, and can enqueue after dead or done jobs", { skip: !process.env.DATABASE_URL }, async () => {
  const db = createDb({ pool: 3 }), ops = createPlatformDb({ pool: 1 }), tenantId = randomUUID();
  const { files, storage } = memoryStorage();
  try {
    await ops.tenant.create({ data: { id: tenantId, slug: tenantId, name: "[DỮ LIỆU MẪU]", planId: "basic", status: "active" } });
    const repo = forTenant(db, tenantId), outbox = forPlatform(ops).outbox;
    const media = { get: (tenant: string, id: string) => forTenant(db, tenant).media.get(id),
      promote: (tenant: string, id: string, data: Parameters<typeof promoteMedia>[3]) => promoteMedia(db, tenant, id, data),
      reject: (tenant: string, id: string, reason: string) => rejectMedia(db, tenant, id, reason),
      publish: async (tenant: string, id: string, key: string, previous: string) => (await forTenant(db, tenant).media.update(id, { key, visibility: "public" }, { key: previous, status: "ready", visibility: "private" })).count === 1 };
    const handle = createMediaPublish({ media, storage });
    const enqueue = (id: string) => withTenantTransaction(db, tenantId, tx => publishMedia(tx, [id]));
    const pending = (id: string) => repo.outbox.first({ where: { topic: "media.publish", status: "pending", payload: { path: ["id"], equals: id } } });
    const poll = (now: Date) => runOnce({ outbox, topics: { "media.publish": { handle } }, tenantId, now: () => now });
    const first = await reserveUpload(db, tenantId, { mime: "application/pdf", size: 8 }, "local");
    files.set(first.key, Buffer.from("%PDF-1.7"));
    await enqueue(first.id);
    const initial = await pending(first.id); assert.ok(initial, "quarantine reference must get a publish job");
    const now = new Date(Date.now() + 1000);
    assert.equal(await poll(now), 1);
    const waiting = await pending(first.id); assert.ok(waiting); assert.equal(waiting.attempts, 1); assert.ok(waiting.runAt > now);
    await enqueue(first.id); assert.equal((await pending(first.id))?.id, initial.id);
    await createMediaScan({ media, storage })(scanJob(tenantId, first.id));
    await poll(new Date(waiting.runAt.getTime() + 1));
    assert.equal((await repo.media.get(first.id))?.visibility, "public");
    assert.equal((await repo.outbox.get(initial.id))?.status, "done");
    const second = await repo.media.create({ key: `private/${tenantId}/second.pdf`, driver: "local", mime: "application/pdf", size: 8, status: "ready", visibility: "private" });
    await enqueue(second.id); const doomed = (await pending(second.id))!;
    await poll(new Date(Date.now() + 1000));
    assert.equal((await repo.outbox.get(doomed.id))?.status, "failed", "missing private file makes old job dead");
    files.set(second.key, Buffer.from("%PDF-1.7"));
    await Promise.all([enqueue(second.id), enqueue(second.id)]);
    const replacement = (await pending(second.id))!;
    assert.notEqual(replacement.id, doomed.id); assert.notEqual(replacement.idempotencyKey, doomed.idempotencyKey);
    assert.equal(await repo.outbox.count({ where: { topic: "media.publish", status: { in: ["pending", "processing"] }, payload: { path: ["id"], equals: second.id } } }), 1);
    await poll(new Date(Date.now() + 1000));
    assert.equal((await repo.media.get(second.id))?.visibility, "public");
    const third = await repo.media.create({ key: `private/${tenantId}/third.pdf`, driver: "local", mime: "application/pdf", size: 8, status: "ready", visibility: "private" });
    await repo.outbox.create({ topic: "media.publish", payload: { tenantId, id: third.id }, idempotencyKey: `media.publish:${third.id}`, status: "done" });
    await enqueue(third.id); assert.ok(await pending(third.id), "legacy done job must not suppress a new publication");
    const thirdJob = (await pending(third.id))!;
    await repo.outbox.update(thirdJob.id, { status: "processing" }); await enqueue(third.id);
    assert.equal(await repo.outbox.count({ where: { payload: { path: ["id"], equals: third.id } } }), 2, "processing job is deduplicated");
    await repo.media.update(third.id, { status: "failed" });
    await handle({ ...thirdJob, tenantId });
  } finally { await ops.tenant.deleteMany({ where: { id: tenantId } }); await Promise.all([db.$disconnect(), ops.$disconnect()]); }
});
