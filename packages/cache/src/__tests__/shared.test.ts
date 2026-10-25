import assert from "node:assert/strict";
import { test } from "node:test";
import { createMemoryCache } from "../memory.ts";
import { createRedisContentCache } from "../shared.ts";
import { createRedisCore, createUseCacheHandler } from "../redis.js";

const options = { keyParts: "page", tags: ["tenant:test:page:home"] };

test("draft bypass", async () => {
  const core = createRedisCore("redis://127.0.0.1:1", { log: () => assert.fail("draft touched Redis") });
  try {
    const cache = createRedisContentCache({ core, memory: createMemoryCache() });
    assert.equal(await cache.cached(async () => "draft", { ...options, mode: "draft" }), "draft");
  } finally { core.close(); }
});

test("AC5 Redis down: render fallback, bounded secret-free warnings, invalidation rejects", async () => {
  let time = 100_000;
  const logs: string[] = [];
  const core = createRedisCore("redis://secret:password@127.0.0.1:1", { now: () => time, log: message => logs.push(message) });
  try {
    const cache = createRedisContentCache({ core, memory: createMemoryCache() });
    let calls = 0;
    const fn = async () => ++calls;
    assert.equal(await cache.cached(fn, options), 1);
    assert.equal(await cache.cached(fn, options), 2);
    const readyListeners = core.command.listenerCount("ready");
    const burst = Array.from({ length: 100 }, () => cache.cached(fn, options));
    assert.ok(core.command.listenerCount("ready") <= readyListeners + 1, "outage waiters must share one readiness listener");
    await Promise.all(burst);
    assert.equal(calls, 102, "outage renders bypass L1");
    const handler = createUseCacheHandler(core);
    assert.equal(await handler.get("missing", []), undefined);
    await handler.set("missing", Promise.resolve({ value: new ReadableStream({ start(c) { c.close(); } }), tags: [], timestamp: time, expire: 60, revalidate: 30, stale: 30 }));
    assert.equal(await handler.getExpiration([]), Infinity);
    await assert.rejects(cache.invalidate(options.tags));
    assert.equal(logs.length, 1);
    assert.ok(logs.every(line => !/secret|password|redis:\/\//.test(line)));
    time += 60_000;
    await handler.get("missing", []);
    assert.equal(logs.length, 2);
    let attempts = 0;
    await assert.rejects(cache.cached(async () => { attempts++; throw Error("application error"); }, options), /application error/);
    assert.equal(attempts, 1, "application errors must not be retried as Redis failures");
  } finally { core.close(); }
});
