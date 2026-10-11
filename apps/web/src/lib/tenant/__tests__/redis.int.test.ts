import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import type { HostRecord } from "@solar/db";
import Redis from "ioredis";
import { createHostResolver } from "../resolver";
import { createRedisCache } from "../redis";

test("Redis pub/sub refreshes primary, removal and negative caches in two instances within 5s", {
  skip: !process.env.REDIS_URL && "REDIS_URL missing: requires Redis 7 (CI db service)", timeout: 20_000,
}, async (t) => {
  const first = createRedisCache(process.env.REDIS_URL!);
  const second = createRedisCache(process.env.REDIS_URL!);
  t.after(() => { first.close(); second.close(); });
  await Promise.all([first.ready, second.ready]);
  const hostname = `${randomUUID()}.localhost`;
  let current: HostRecord | null = { hostname, tenantId: randomUUID(), siteId: randomUUID(), status: "active", isPrimary: false, tenantStatus: "active", primaryHost: "old.localhost" };
  let calls = 0;
  const lookup = async () => { calls++; return current; };
  const a = createHostResolver({ lookup, ...first });
  const b = createHostResolver({ lookup, ...second });
  await a.resolve(hostname);
  assert.deepEqual(await b.resolve(hostname), current);
  assert.equal(calls, 1, "second instance must read the Redis cache");
  const cold = createRedisCache(process.env.REDIS_URL!);
  t.after(() => cold.close());
  current = { ...current, primaryHost: "cold.localhost" };
  await createHostResolver({ lookup, ...cold }).invalidate([hostname]);
  const coldStart = performance.now();
  let coldResult = await b.resolve(hostname);
  while (coldResult?.primaryHost !== current.primaryHost && performance.now() - coldStart < 5_000) {
    await new Promise((r) => setTimeout(r, 20));
    coldResult = await b.resolve(hostname);
  }
  assert.equal(coldResult?.primaryHost, current.primaryHost, "cold-start invalidation must wait briefly for the command connection");
  for (const next of [{ ...current, primaryHost: "new.localhost" }, { ...current, status: "removed" as const }, null]) {
    current = next;
    const started = performance.now();
    await a.invalidate([hostname]);
    let result = await b.resolve(hostname);
    while (JSON.stringify(result) !== JSON.stringify(current) && performance.now() - started < 5_000) {
      await new Promise((r) => setTimeout(r, 20));
      result = await b.resolve(hostname);
    }
    assert.deepEqual(result, current);
    assert.ok(performance.now() - started <= 5_000);
    t.diagnostic(`Redis invalidation: ${(performance.now() - started).toFixed(1)} ms`);
  }
  await a.invalidate([hostname]);
});

test("Redis subscriber reconnect discards memory snapshots after a pub/sub gap", {
  skip: !process.env.REDIS_URL && "REDIS_URL missing: requires Redis 7", timeout: 15_000,
}, async (t) => {
  const monitor = new Redis(process.env.REDIS_URL!, { connectTimeout: 1_000, commandTimeout: 1_000, maxRetriesPerRequest: 0 });
  t.after(() => monitor.disconnect());
  const subscriberIds = async () => new Set(String(await monitor.client("LIST", "TYPE", "PUBSUB"))
    .trim().split("\n").map((line) => /^id=(\d+)/.exec(line)?.[1]).filter((id): id is string => Boolean(id)));
  const previous = await subscriberIds();
  const cache = createRedisCache(process.env.REDIS_URL!);
  t.after(() => cache.close());
  await cache.ready;
  const ownId = [...await subscriberIds()].find((id) => !previous.has(id));
  assert.ok(ownId, "only kill the subscriber connection created by this test");
  const hostname = `${randomUUID()}.localhost`;
  let current: HostRecord = { hostname, tenantId: randomUUID(), siteId: randomUUID(), status: "active", isPrimary: true, tenantStatus: "active", primaryHost: hostname };
  const resolver = createHostResolver({ lookup: async () => current, ...cache });
  await resolver.resolve(hostname);
  current = { ...current, status: "removed" };
  await cache.store.del([`tenancy:host:${hostname}`]);
  let resets = 0;
  cache.bus.subscribe((hosts) => { if (!hosts.length) resets++; });
  await monitor.client("KILL", "ID", ownId);
  const started = performance.now();
  while (resets < 2 && performance.now() - started < 5_000) await new Promise((r) => setTimeout(r, 20));
  assert.ok(resets >= 2, "disconnect and successful resubscribe must both reset memory");
  assert.deepEqual(await resolver.resolve(hostname), current);
  await resolver.invalidate([hostname]);
});
