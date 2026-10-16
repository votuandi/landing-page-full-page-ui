import assert from "node:assert/strict";
import test from "node:test";
import { createLoginLimiter, memoryCounter, redisCounter } from "../rateLimit.ts";

test("five failures lock one tenant for 15 minutes; check does not increment", async () => {
  let now = 1000;
  const limiter = createLoginLimiter({ fallback: memoryCounter(() => now) });
  const key = { realm: "site" as const, tenantId: "a", identifier: "a@x.vn", ip: "127.0.0.1" };
  for (let i = 0; i < 8; i++) assert.deepEqual(await limiter.check(key), { ok: true });
  for (let i = 0; i < 5; i++) await limiter.fail(key);
  assert.deepEqual(await limiter.check(key), { ok: false, retryAfterSec: 900 });
  assert.deepEqual(await limiter.check({ ...key, tenantId: "b" }), { ok: true });
  assert.deepEqual(await limiter.check({ ...key, realm: "platform" }), { ok: true });
  now += 900_000;
  assert.deepEqual(await limiter.check(key), { ok: true });
});
test("success clears account failures but preserves IP abuse limits; fallback works", async () => {
  const primary = { get: async () => { throw new Error("Redis down"); }, increment: async () => { throw new Error("Redis down"); }, delete: async () => { throw new Error("Redis down"); } };
  const limiter = createLoginLimiter({ primary, ipLimit: 3 });
  const key = { realm: "site" as const, tenantId: "a", identifier: "user", ip: "ip" };
  await limiter.fail(key);
  await limiter.succeed(key);
  assert.deepEqual(await limiter.check(key), { ok: true });
  await limiter.fail({ ...key, identifier: "other" });
  await limiter.fail({ ...key, identifier: "third" });
  assert.equal((await limiter.check({ ...key, tenantId: "b" })).ok, false);
});
test("lock lasts 15 minutes from the fifth failure, even when failures are spread out", async () => {
  let now = 1000;
  const limiter = createLoginLimiter({ fallback: memoryCounter(() => now) });
  const key = { realm: "site" as const, tenantId: "a", identifier: "user", ip: "ip" };
  for (let i = 0; i < 5; i++) { await limiter.fail(key); if (i < 4) now += 100_000; }
  assert.deepEqual(await limiter.check(key), { ok: false, retryAfterSec: 900 });
  now += 899_999;
  assert.equal((await limiter.check(key)).ok, false);
  now++;
  assert.deepEqual(await limiter.check(key), { ok: true });
});
test("Redis counter uses atomic read/increment/delete scripts without owning a connection", async () => {
  const calls: unknown[][] = [];
  const counter = redisCounter({ eval: async (...args: unknown[]) => { calls.push(args); return [4, 1000]; } });
  assert.deepEqual(await counter.get("key"), { count: 4, resetMs: 1000 });
  assert.deepEqual(await counter.increment("key", 900_000), { count: 4, resetMs: 1000 });
  await counter.delete("key");
  assert.match(String(calls[1][0]), /INCR/);
  assert.match(String(calls[1][0]), /PEXPIRE/);
  assert.equal(calls[1][1], 1);
  assert.equal(calls[1][2], "key");
});
