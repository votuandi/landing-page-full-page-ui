import assert from "node:assert/strict";
import test from "node:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { cacheKey, createMemoryCache, tenantTag, pageTag, siteTag, collectionTag, isValidTag, signRevalidate, verifyRevalidate, invalidationJob } from "../index.ts";
const a = "00000000-0000-4000-8000-000000000001", b = "00000000-0000-4000-8000-000000000002";
test("lazy memory without REDIS_URL; worker import with REDIS_URL does not connect", async () => {
  const script = `
    const sockets = () => process._getActiveHandles().filter(h => h.connecting || h.remoteAddress).length;
    const before = sockets();
    const cache = await import('./src/index.ts');
    if (sockets() !== before || globalThis[Symbol.for('solar.cache.redis')]) throw Error('import opened Redis');
    await cache.cached(async () => 'draft', { keyParts: 'draft', tags: [], mode: 'draft' });
    if (sockets() !== before || globalThis[Symbol.for('solar.cache.redis')]) throw Error('draft opened Redis');
    const failure = cache.cached(() => { throw Error('draft loader'); }, { keyParts: 'draft-error', tags: [], mode: 'draft' });
    await failure.then(() => { throw Error('cached error'); }, error => { if (error.message !== 'draft loader') throw error; });
    if (!process.env.REDIS_URL) {
      let calls = 0;
      const opts = { keyParts: 'lazy', tags: [] };
      if (await cache.cached(async () => ++calls, opts) !== 1) throw Error('miss');
      if (await cache.cached(async () => ++calls, opts) !== 1) throw Error('not memory');
    }
  `;
  for (const url of ["", "redis://127.0.0.1:1"]) await promisify(execFile)(process.execPath,
    ["--import", "tsx", "--input-type=module", "-e", script], { cwd: new URL("../..", import.meta.url), env: { ...process.env, REDIS_URL: url }, timeout: 5_000 });
});
const options = (siteId = a, mode: "published" | "draft" = "published") => ({ keyParts: cacheKey({ siteId, locale: "vi", mode, parts: ["home"] }), tags: [tenantTag(siteId)], mode });
test("keys separate site, locale, mode and structured parts; tags are allowlisted", () => {
  assert.notEqual(options(a).keyParts, options(b).keyParts);
  assert.notEqual(options(a).keyParts, options(a, "draft").keyParts);
  for (const tag of [tenantTag(a), siteTag(a), pageTag(a, ""), pageTag(a, "uu-dai/nang-luong"), collectionTag(a, "productCategory"), "platform:settings", "platform:entitlements"]) assert.ok(isValidTag(tag), tag);
  for (const tag of ["other:x", "tenant:bad", `tenant:${a}:anything`, `tenant:${a}:page:../x`, "platform:secret", `tenant:${a}:collection:`]) assert.ok(!isValidTag(tag), tag);
});
test("tenant A invalidation preserves B; draft bypasses; TTL and LRU expire", async () => {
  let time = 0, reads = 0;
  const c = createMemoryCache({ now: () => time, ttlMs: 10, maxEntries: 2 });
  const read = () => Promise.resolve(++reads);
  assert.equal(await c.cached(read, options()), 1);
  assert.equal(await c.cached(read, options(b)), 2);
  await c.invalidate([tenantTag(a)]);
  assert.equal(await c.cached(read, options(b)), 2);
  assert.equal(await c.cached(read, options()), 3);
  assert.equal(await c.cached(read, options(a, "draft")), 4);
  assert.equal(await c.cached(read, options(a, "draft")), 5);
  time = 10;
  assert.equal(await c.cached(read, options()), 6);
  await c.cached(read, { keyParts: "third", tags: [] });
  assert.equal(await c.cached(read, options(b)), 8);
  // Per-entry TTL (kill switch: 60 s instead of 24 h).
  const short = { keyParts: "short", tags: [], ttlMs: 2 };
  const first = await c.cached(read, short);
  time = 11;
  assert.equal(await c.cached(read, short), first);
  time = 12;
  assert.equal(await c.cached(read, short), first + 1);
});
test("single flight, errors retry, invalidation during a slow render never resurrects stale content", async () => {
  const c = createMemoryCache();
  let resolve!: (s: string) => void, reads = 0;
  const slow = () => { reads++; return new Promise<string>(r => { resolve = r; }); };
  const first = c.cached(slow, options()), second = c.cached(slow, options());
  await Promise.resolve();
  assert.equal(reads, 1);
  await c.invalidate([tenantTag(a)]);
  assert.equal(await c.cached(async () => "fresh", options()), "fresh");
  resolve("old");
  assert.deepEqual(await Promise.all([first, second]), ["old", "old"]);
  assert.equal(await c.cached(slow, options()), "fresh");
  await c.invalidate([tenantTag(a)]);
  await assert.rejects(c.cached(async () => { throw Error("failed"); }, options()), /failed/);
  assert.equal(await c.cached(async () => "retried", options()), "retried");
});
test("HMAC verifies raw bytes, rejects malformed signatures; jobs have unique idempotency keys", () => {
  const body = '{"tags":[]}';
  const signature = signRevalidate(body, "secret");
  assert.ok(verifyRevalidate(body, signature, "secret"));
  for (const sig of ["", "00", "z".repeat(64), signature + "00"]) assert.ok(!verifyRevalidate(body, sig, "secret"));
  assert.ok(!verifyRevalidate(body + " ", signature, "secret"));
  assert.ok(!verifyRevalidate(body, signature, "other"));
  const job = invalidationJob([tenantTag(a)], { hosts: ["a.localhost"] });
  assert.equal(job.topic, "invalidate");
  assert.deepEqual(job.payload, { tags: [tenantTag(a)], hosts: ["a.localhost"] });
  assert.notEqual(job.idempotencyKey, invalidationJob([tenantTag(a)]).idempotencyKey);
});
