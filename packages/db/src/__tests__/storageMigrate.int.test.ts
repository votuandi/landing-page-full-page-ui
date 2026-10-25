import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createLocalDriver, storageFor, type StorageDriver } from "@solar/storage";
import { createPlatformDb } from "../client.ts";
import { forTenant, forPlatform } from "../repository.ts";
import { reserveUpload } from "../media.ts";

test("migrate: only target tenant; source kept; checksum; idempotent; private; skips non-ready; dry-run", { skip: !process.env.DATABASE_URL || !process.env.STORAGE_S3_TEST_ENDPOINT, timeout: 60_000 }, async () => {
  const db = createPlatformDb({ pool: 2 }), tenantId = randomUUID(), other = randomUUID(), root = await mkdtemp(join(tmpdir(), "solar-migrate-"));
  const local = createLocalDriver({ root, publicBase: "https://local.example" });
  const s3 = storageFor("s3", { MEDIA_PUBLIC_BASE: "https://s3.example", S3_BUCKET: process.env.STORAGE_S3_TEST_BUCKET, S3_ENDPOINT: process.env.STORAGE_S3_TEST_ENDPOINT, S3_REGION: "us-east-1", S3_FORCE_PATH_STYLE: "true", S3_ACCESS_KEY_ID: process.env.STORAGE_S3_TEST_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY: process.env.STORAGE_S3_TEST_SECRET_ACCESS_KEY });
  const storage = (driver: "local" | "s3") => driver === "local" ? local : s3;
  const keys: string[] = [];
  try {
    for (const id of [tenantId, other]) await db.tenant.create({ data: { id, slug: id, name: "[DỮ LIỆU MẪU]", planId: "premium" } });
    const repo = forTenant(db, tenantId), rows = [];
    for (let i = 0; i < 4; i++) {
      const key = `${i === 0 ? "private" : "tenants"}/${tenantId}/${randomUUID()}.${i === 3 ? "mp4" : "png"}`;
      const variants = i === 3 ? [] : [640, 1280, 1920].flatMap(width => ["avif", "webp"].map(format => ({ key: `${key}-w${width}.${format}`, width, height: width, size: 5, format })));
      rows.push(await repo.media.create({ key, driver: "local", status: "ready", visibility: i === 0 ? "private" : "public", mime: i === 3 ? "video/mp4" : "image/png", size: 5, variants }));
      for (const k of [key, ...variants.map(v => v.key)]) { keys.push(k); await local.put(k, Buffer.from("bytes"), { contentType: "image/png" }); }
    }
    const foreign = await forTenant(db, other).media.create({ key: `tenants/${other}/keep.png`, driver: "local", mime: "image/png", size: 5, status: "ready" });
    const pending = await reserveUpload(db, tenantId, { mime: "image/png", size: 5 }, "local");
    const options = { tenantId, from: "local" as const, to: "s3" as const, storage };
    const migrate = forPlatform(db).media.migrate;
    assert.equal((await migrate({ ...options, dryRun: true })).copied, 0);
    assert.equal((await db.tenant.findUniqueOrThrow({ where: { id: tenantId } })).storageDriver, null);
    assert.equal((await migrate(options)).copied, 4);
    for (const key of keys) assert.equal(createHash("sha256").update((await s3.get(key))!).digest("hex"), createHash("sha256").update((await local.get(key))!).digest("hex"));
    for (const row of rows) assert.equal((await repo.media.get(row.id))?.driver, "s3");
    assert.equal((await repo.media.get(pending.id))?.driver, "local");
    assert.equal((await forTenant(db, other).media.get(foreign.id))?.driver, "local");
    assert.equal((await db.tenant.findUniqueOrThrow({ where: { id: tenantId } })).storageDriver, "s3");
    assert.equal((await reserveUpload(db, tenantId, { mime: "image/png", size: 5 }, "local")).driver, "s3", "reserve uses tenant driver");
    assert.match(JSON.stringify((await repo.outbox.first({ where: { topic: "invalidate" } }))?.payload), new RegExp(`tenant:${tenantId}`));
    assert.equal((await migrate(options)).copied, 0);
    const missing = await repo.media.create({ key: `private/${tenantId}/missing.png`, driver: "local", mime: "image/png", size: 5, status: "ready" });
    await assert.rejects(migrate(options), /thiếu|Không tìm thấy/i);
    assert.equal((await repo.media.get(missing.id))?.driver, "local");
  } finally { for (const key of keys) await s3.delete(key); await db.tenant.deleteMany({ where: { id: { in: [tenantId, other] } } }); await db.$disconnect(); await rm(root, { recursive: true, force: true }); }
});

test("migrate: checksum mismatch keeps row source; unknown tenant and invalid target do not write", { skip: !process.env.DATABASE_URL }, async () => {
  const db = createPlatformDb({ pool: 2 }), tenantId = randomUUID();
  const driver = { get: async () => Buffer.from("source"), put: async () => {}, delete: async () => {}, head: async () => null, publicUrl: (key: string) => key, list: async function* () {} } satisfies StorageDriver;
  try {
    await db.tenant.create({ data: { id: tenantId, slug: tenantId, name: "[DỮ LIỆU MẪU]", planId: "premium" } });
    const repo = forTenant(db, tenantId), row = await repo.media.create({ key: `private/${tenantId}/a.png`, driver: "local", mime: "image/png", size: 6, status: "ready" });
    const migrate = forPlatform(db).media.migrate;
    await assert.rejects(migrate({ tenantId: randomUUID(), from: "local", to: "s3", storage: () => driver }), /Không tìm thấy tenant/);
    await assert.rejects(migrate({ tenantId, from: "local", to: "s3", storage: kind => { if (kind === "s3") throw new Error("S3_BUCKET"); return driver; } }), /S3_BUCKET/);
    assert.equal((await db.tenant.findUniqueOrThrow({ where: { id: tenantId } })).storageDriver, null);
    await assert.rejects(migrate({ tenantId, from: "local", to: "s3", storage: kind => kind === "local" ? driver : { ...driver, get: async () => Buffer.from("wrong") } }), /checksum/i);
    assert.equal((await repo.media.get(row.id))?.driver, "local");
    let changed = false;
    const result = await migrate({ tenantId, from: "local", to: "s3", storage: kind => kind === "local" ? driver : { ...driver, put: async () => {
      if (!changed) { changed = true; await repo.media.update(row.id, { key: `tenants/${tenantId}/published.png`, visibility: "public" }); }
    } } });
    assert.equal(result.copied, 0); assert.equal(result.skipped, 1); assert.equal(result.remaining, 1);
    assert.equal((await repo.media.get(row.id))?.driver, "local", "a row changed during copying keeps its current source");
  } finally { await db.tenant.deleteMany({ where: { id: tenantId } }); await db.$disconnect(); }
});
