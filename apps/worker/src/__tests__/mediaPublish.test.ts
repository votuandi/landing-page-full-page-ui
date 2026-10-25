import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import type { MediaVariant, OutboxJob } from "@solar/db";
import type { StorageDriver } from "@solar/storage";
import { createMediaPublish, cleanupExpiredMedia } from "../handlers/mediaPublish.ts";
import { PermanentError } from "../loop.ts";

test("row driver routes publish and cleanup; driver changed during publish retries", async () => {
  const f = variantsSetup(), selected: string[] = [];
  const handle = createMediaPublish({ media: f.media, storage: kind => { selected.push(kind); return f.storage; } });
  await handle(f.job);
  assert.deepEqual(selected, ["local"]);
  await cleanupExpiredMedia({ expireStale: async () => [{ tenantId: f.row.tenantId, key: `quarantine/${f.row.tenantId}/old`, driver: "s3" }], storage: kind => { selected.push(kind); return f.storage; } });
  assert.equal(selected.at(-1), "s3");
  const race = variantsSetup();
  race.media.publish = async () => { race.row.driver = "s3"; return false; };
  await assert.rejects(createMediaPublish({ media: race.media, storage: race.storage })(race.job), /driver|thay đổi/);
});

test("publish enqueues tenant invalidate; crash retries invalidate; CAS false does not invalidate", async () => {
  for (const cas of [true, false]) {
    const f = variantsSetup(); const tags: string[][] = []; let fail = true;
    if (!cas) f.media.publish = async () => false;
    const handle = createMediaPublish({ media: f.media, storage: f.storage, invalidate: async (tenant, job) => {
      assert.equal(tenant, f.row.tenantId); assert.equal(job.topic, "invalidate");
      assert.deepEqual(job.payload.tags, [`tenant:${tenant}`]);
      if (fail) { fail = false; throw Error("outbox unavailable"); }
      tags.push(job.payload.tags);
    } });
    if (cas) { await assert.rejects(handle(f.job), /outbox unavailable/); await handle(f.job); }
    else await handle(f.job);
    assert.equal(tags.length, cas ? 1 : 0);
  }
});

function variantsSetup(variants: unknown = undefined) {
  const tenantId = randomUUID(), id = randomUUID(), original = `private/${tenantId}/2026/10/${id}.jpg`;
  const generated = [640, 1280, 1920].flatMap(width => (["avif", "webp"] as const).map(format => ({ key: original.replace(/\.jpg$/, `-w${width}.${format}`), format, width, height: width / 2, size: 4 })));
  const row = { id, tenantId, key: original, status: "ready", visibility: "private", mime: "image/jpeg", size: 4, variants: variants === undefined ? generated : variants, driver: "local" as "local" | "s3" };
  const files = new Map<string, Uint8Array>([original, ...generated.map(v => v.key)].map(key => [key, Buffer.from("data")]));
  const copies: { key: string; contentType: string; cacheControl?: string }[] = [];
  let published = 0;
  const storage = {
    get: async (key: string) => files.get(key) ?? null,
    put: async (key: string, body: Uint8Array, opts: { contentType: string; cacheControl?: string }) => { copies.push({ key, ...opts }); files.set(key, body); },
    delete: async (key: string) => { files.delete(key); },
  } as StorageDriver;
  const media = { get: async () => row, publish: async (_tenant: string, _id: string, key: string, previous: string, variants?: MediaVariant[]) => {
    assert.equal(previous, original); published++; row.key = key; row.visibility = "public";
    if (variants !== undefined) row.variants = variants;
    return true;
  } };
  const job: OutboxJob = { id: randomUUID(), tenantId, topic: "media.publish", payload: { tenantId, id }, idempotencyKey: `media.publish:${id}`, attempts: 1, createdAt: new Date(), runAt: new Date() };
  return { row, original, generated, files, copies, media, storage, job, published: () => published, handle: createMediaPublish({ media, storage }) };
}

test("publish moves variants", async () => {
  const f = variantsSetup(); await f.handle(f.job);
  assert.equal(f.published(), 1); assert.equal(f.files.size, 7);
  assert.ok([...f.files.keys()].every(key => key.startsWith(`tenants/${f.row.tenantId}/`)));
  assert.deepEqual(f.row.variants, f.generated.map(v => ({ ...v, key: v.key.replace(/^private\//, "tenants/") })));
  assert.deepEqual(f.copies.map(c => c.contentType), ["image/jpeg", "image/avif", "image/webp", "image/avif", "image/webp", "image/avif", "image/webp"]);
  assert.ok(f.copies.every(c => c.cacheControl === "public, max-age=31536000, immutable"));
});

test("publish recovery removes private variants", async () => {
  const f = variantsSetup(); let crash = true;
  const remove = f.storage.delete;
  f.storage.delete = async key => { if (crash) throw Error("crash after CAS"); await remove(key); };
  await assert.rejects(f.handle(f.job), /crash after CAS/);
  assert.equal(f.row.visibility, "public"); assert.equal(f.files.size, 14);
  crash = false; await f.handle(f.job);
  assert.equal(f.files.size, 7); assert.equal(f.copies.length, 7); assert.equal(f.published(), 1);
  assert.ok([...f.files.keys()].every(key => key.startsWith("tenants/")));
});

test("missing variant is permanent", async () => {
  const f = variantsSetup(); f.files.delete(f.generated[2].key);
  await assert.rejects(f.handle(f.job), PermanentError);
  assert.equal(f.published(), 0); assert.equal(f.row.key, f.original); assert.equal(f.row.visibility, "private");
});

test("publish tolerates null/foreign variants", async () => {
  for (const variants of [null, { thumbnail: { url: "private/legacy/thumbnail.jpg" } }, [{ arbitrary: "legacy" }]]) {
    const f = variantsSetup(variants); await f.handle(f.job);
    assert.equal(f.published(), 1); assert.equal(f.copies.length, 1); assert.deepEqual(f.row.variants, variants);
  }
});

test("publish refuses foreign or traversing variant keys before reading or deleting files", async () => {
  for (const visibility of ["private", "public"]) for (const badKey of [`${visibility === "public" ? "tenants" : "private"}/${randomUUID()}/x.avif`, `private/../x.avif`]) {
    const f = variantsSetup(); f.row.visibility = visibility;
    if (visibility === "public") f.row.key = f.original.replace(/^private\//, "tenants/");
    f.row.variants = [{ ...f.generated[0], key: badKey }];
    f.storage.get = async () => { throw Error("must not read"); };
    f.storage.delete = async () => { throw Error("must not delete"); };
    await assert.rejects(f.handle(f.job), PermanentError); assert.equal(f.published(), 0);
  }
});

test("publish CAS false retains private original and variants for retry", async () => {
  const f = variantsSetup(); f.media.publish = async () => false;
  await f.handle(f.job);
  for (const key of [f.original, ...f.generated.map(v => v.key)]) assert.ok(f.files.has(key));
  assert.equal(f.row.visibility, "private");
});

test("media.publish: ready private to public, stable target across retries, quarantine cron cleanup", async () => {
  const tenantId = randomUUID(), id = randomUUID();
  const row = { id, tenantId, key: `private/${tenantId}/2026/10/${id}.pdf`, status: "ready", visibility: "private", mime: "application/pdf", size: 8, driver: "local" as const };
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
  await cleanupExpiredMedia({ expireStale: async () => [{ tenantId, key: `quarantine/${tenantId}/old`, driver: "local" }], storage });
  assert.equal(files.size, 1);
});

test("I2: quarantine publish is retryable; failed media is a completed no-op", async () => {
  const tenantId = randomUUID(), id = randomUUID();
  const row = { id, tenantId, key: `quarantine/${tenantId}/${id}`, status: "quarantine", visibility: "private", mime: "application/pdf", size: 8, driver: "local" as const };
  const storage = { get: async () => { throw Error("must not read quarantine or failed content"); } } as unknown as StorageDriver;
  const handle = createMediaPublish({ media: { get: async () => row, publish: async () => false }, storage });
  const job: OutboxJob = { id: randomUUID(), tenantId, topic: "media.publish", payload: { tenantId, id }, idempotencyKey: `media.publish:${id}`, attempts: 1, createdAt: new Date(), runAt: new Date() };
  await assert.rejects(handle(job), error => error instanceof Error && !(error instanceof PermanentError));
  row.status = "failed"; await handle(job);
});
