import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import sharp from "sharp";
import { createDb, createPlatformDb, forTenant, forPlatform, withTenantTransaction, publishMedia, reserveUpload, promoteMedia, rejectMedia, cancelUpload, mediaUsage, type OutboxJob } from "@solar/db";
import type { StorageDriver } from "@solar/storage";
import { createMediaScan } from "../handlers/mediaScan.ts";
import { createMediaPublish } from "../handlers/mediaPublish.ts";
import { runOnce } from "../loop.ts";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createLocalDriver } from "@solar/storage";
import { videoS3Fixture } from "../../../../packages/storage/src/__tests__/video.fixture.ts";
import { probeVideo, posterFrame, runVideoTool } from "../video.ts";

const hasFfmpeg = [process.env.FFMPEG_PATH || "ffmpeg", process.env.FFPROBE_PATH || "ffprobe"].every(command => spawnSync(command, ["-version"], { windowsHide: true, stdio: "ignore" }).status === 0);
const videoSkip = !hasFfmpeg && process.env.MEDIA_REQUIRE_FFMPEG !== "1" ? "ffmpeg/ffprobe missing; set MEDIA_REQUIRE_FFMPEG=1 in CI" : false;

test("real ffmpeg poster", { skip: videoSkip, timeout: 60_000 }, async () => {
  assert.ok(hasFfmpeg, "ffmpeg and ffprobe are required");
  const folder = await mkdtemp(join(tmpdir(), "video-local-"));
  try {
    const storage = createLocalDriver({ root: folder, publicBase: "https://cdn.example/media" });
    await videoPipeline(storage);
    const audioOnly = await runVideoTool(process.env.FFMPEG_PATH || "ffmpeg", ["-v", "error", "-nostdin", "-f", "lavfi", "-i", "anullsrc", "-t", "0.2", "-vn", "-f", "mp4", "-movflags", "frag_keyframe+empty_moov", "pipe:1"]);
    for (const bytes of [Buffer.from("000000186674797069736f6d", "hex"), Buffer.from("1a45dfa3", "hex"), audioOnly]) {
      const tenantId = randomUUID(), id = randomUUID(), key = `quarantine/${tenantId}/${id}`;
      await storage.put(key, bytes, { contentType: "video/mp4" }); let rejected = false;
      await createMediaScan({ storage, media: {
        get: async () => ({ tenantId, id, key, mime: "video/mp4", size: bytes.length, status: "quarantine", visibility: "private" }),
        promote: async () => { throw Error("invalid video promoted"); }, reject: async () => { rejected = true; return true; },
      } })(scanJob(tenantId, id));
      assert.ok(rejected); assert.equal(await storage.get(key), null);
    }
  } finally { await rm(folder, { recursive: true, force: true }); }
});

test("s3 video publish serves range", { skip: videoSkip || (!process.env.STORAGE_S3_TEST_ENDPOINT && process.env.STORAGE_REQUIRE_S3 !== "1" ? "MinIO endpoint missing; STORAGE_REQUIRE_S3=1 makes it mandatory" : false), timeout: 60_000 }, async () => {
  assert.ok(hasFfmpeg); assert.ok(process.env.STORAGE_S3_TEST_ENDPOINT, "STORAGE_S3_TEST_ENDPOINT required");
  const fixture = await videoS3Fixture();
  try {
    const row = await videoPipeline(fixture.storage);
    const response = await fetch(fixture.storage.publicUrl(row.key), { headers: { Range: "bytes=0-99" } });
    assert.equal(response.status, 206); assert.equal(response.headers.get("content-type"), "video/mp4");
    assert.equal((await response.arrayBuffer()).byteLength, 100);
    assert.equal((await fetch(fixture.storage.publicUrl(row.variants[0].key))).status, 200);
    assert.equal((await fetch(`${process.env.STORAGE_S3_TEST_ENDPOINT}/${new URL(fixture.storage.publicUrl(row.key)).pathname.split("/")[1]}/private/${row.tenantId}/x`)).status, 403);
  } finally { await fixture.cleanup(); }
});

async function videoPipeline(storage: StorageDriver) {
  const bytes = await readFile(new URL("../../../web/public/videos/shorts/ho-gia-dinh-1.mp4", import.meta.url));
  const tenantId = randomUUID(), id = randomUUID();
  let row = { tenantId, id, key: `quarantine/${tenantId}/${id}`, status: "quarantine", visibility: "private", mime: "video/mp4", size: bytes.length, width: 0, height: 0, variants: [] as import("@solar/db").MediaVariant[] };
  await storage.put(row.key, bytes, { contentType: row.mime });
  const media = { get: async () => row, reject: async () => { throw Error("real video rejected"); },
    promote: async (_tenant: string, _id: string, data: Parameters<typeof promoteMedia>[3]) => { row = { ...row, ...data, width: data.width!, height: data.height!, variants: data.variants!, status: "ready" }; return true; },
    publish: async (_tenant: string, _id: string, key: string, _previous: string, variants?: import("@solar/db").MediaVariant[]) => { row = { ...row, key, visibility: "public", variants: variants! }; return true; },
  };
  let dimensions = { width: 0, height: 0 };
  await createMediaScan({ media, storage, video: { probe: async path => { const result = await probeVideo(path); dimensions = result; return result; }, frame: posterFrame } })(scanJob(tenantId, id));
  assert.equal(row.variants.length, 6); assert.equal(row.width, dimensions.width); assert.equal(row.height, dimensions.height);
  for (const variant of row.variants) assert.ok((await sharp(await storage.get(variant.key) ?? undefined).metadata()).width);
  assert.deepEqual(Buffer.from((await storage.get(row.key))!), bytes); assert.equal(row.size, bytes.length);
  const { width, height } = await sharp((await storage.get(row.variants[0].key))!).metadata();
  assert.ok(width && height && width < height, "vertical poster");
  await createMediaPublish({ media, storage })({ ...scanJob(tenantId, id), topic: "media.publish" });
  assert.equal(row.visibility, "public"); assert.ok(row.variants.every(v => v.key.startsWith(`tenants/${tenantId}/`)));
  return row;
}

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
    assert.equal(Array.isArray(ready.variants) ? ready.variants.length : 0, 6);
    const retained = [...files.keys()].sort();
    await repo.media.delete(first.id);
    await repo.media.create({ key: `private/${tenantId}/used`, driver: "local", mime: "video/mp4", size: 1024 ** 3 - input.byteLength, status: "ready", visibility: "private" });
    const second = await reserveUpload(db, tenantId, { mime: "image/png", size: input.byteLength }, "local");
    files.set(second.key, input); await scan(scanJob(tenantId, second.id));
    assert.equal((await repo.media.get(second.id))?.status, "failed");
    assert.ok(await mediaUsage(repo) <= 1024 ** 3);
    const audit = await repo.auditLog.first({ where: { action: "media.rejected", entityId: second.id } });
    assert.match(JSON.stringify(audit?.data), /quota/i);
    assert.equal(await storage.get(second.key), null);
    assert.deepEqual([...files.keys()].sort(), retained, "quota rejection removes its original and all variants, preserving existing media");
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
