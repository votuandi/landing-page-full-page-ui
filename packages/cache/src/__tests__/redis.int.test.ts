import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { test, type TestContext } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { createMemoryCache } from "../memory.ts";
import { createRedisContentCache } from "../shared.ts";
import { createRedisCore, createUseCacheHandler } from "../redis.js";

const redis = { skip: !process.env.REDIS_URL && "REDIS_URL missing: requires Redis 7", timeout: 20_000 };
const hash = (key: string) => createHash("sha256").update(key).digest("hex");
function fixture(t: TestContext) {
  let time = Date.now() + 10_000;
  const now = () => time;
  const a = createRedisCore(process.env.REDIS_URL!, { now, skewMs: 0 });
  const b = createRedisCore(process.env.REDIS_URL!, { now, skewMs: 0 });
  const key = randomUUID(), tag = `tenant:${randomUUID()}`;
  const options = { keyParts: key, tags: [tag] };
  const ca = createRedisContentCache({ core: a, memory: createMemoryCache({ now }) });
  const cb = createRedisContentCache({ core: b, memory: createMemoryCache({ now }) });
  const ha = createUseCacheHandler(a), hb = createUseCacheHandler(b);
  const entry = (value = "old", timestamp = now(), tags = [tag]) => ({
    value: new ReadableStream<Uint8Array>({ start(c) { c.enqueue(Buffer.from(value)); c.close(); } }),
    tags, timestamp, expire: 86_400, revalidate: 60, stale: 60,
  });
  const set = (value = "old", timestamp = now(), tags = [tag]) => ha.set(key, Promise.resolve(entry(value, timestamp, tags)));
  const cleanup = [`uc:${hash(key)}`, `lock:${hash(key)}`, `tag:${tag}:invalidatedAt`];
  t.after(async () => {
    try { if (a.command.status === "ready") await a.command.del(...cleanup); }
    finally { a.close(); b.close(); }
  });
  return { a, b, ca, cb, ha, hb, key, tag, options, entry, set, now, cleanup, tick(ms = 1) { time += ms; } };
}

test("AC1 data cache: two instances check durable clocks without pubsub; tenant isolation", redis, async t => {
  const f = fixture(t); await Promise.all([f.a.ready, f.b.ready]);
  // Suppress only this instance's messages: durable clocks still have to protect it.
  await f.b.subscriber.unsubscribe();
  let calls = 0;
  const fn = async () => ({ date: new Date(0), n: ++calls });
  const first = await f.cb.cached(fn, f.options);
  assert.ok(first.date instanceof Date);
  const other = { keyParts: randomUUID(), tags: [`tenant:${randomUUID()}`] };
  const otherValue = await f.cb.cached(fn, other);
  f.tick(); await f.ca.invalidate([f.tag]); f.tick();
  assert.equal((await f.cb.cached(fn, f.options)).n, 3);
  assert.equal(await f.cb.cached(fn, other), otherValue);
});

test("AC1 use-cache handler: streams round-trip and own/soft tags invalidate across instances", redis, async t => {
  const f = fixture(t); await Promise.all([f.a.ready, f.b.ready]);
  await f.set("bytes ✓");
  const hit = await f.hb.get(f.key, []);
  assert.ok(hit); assert.equal(await new Response(hit.value).text(), "bytes ✓");
  f.tick(); await f.ha.updateTags([f.tag]);
  assert.equal(await f.hb.get(f.key, []), undefined);
  f.tick(); await f.set("fresh", f.now(), []);
  f.tick(); await f.ha.updateTags([f.tag]);
  assert.equal(await f.hb.get(f.key, [f.tag]), undefined);
});

test("AC2 slow render: data and use-cache entries started before invalidation cannot resurrect", redis, async t => {
  const f = fixture(t); await Promise.all([f.a.ready, f.b.ready]);
  await f.b.subscriber.unsubscribe();
  let release!: (value: string) => void;
  let started!: () => void;
  const begun = new Promise<void>(resolve => { started = resolve; });
  const slow = f.cb.cached(() => { started(); return new Promise<string>(resolve => { release = resolve; }); }, f.options);
  await begun;
  const timestamp = f.now();
  f.tick(); await f.ca.invalidate([f.tag]); f.tick();
  release("old"); await slow;
  assert.equal(await f.cb.cached(async () => "new", f.options), "new");
  await f.set("old", timestamp);
  assert.equal(await f.hb.get(f.key, []), undefined);
});

test("AC3 pubsub drop: reconnect clears L1 and clocks protect reads during the gap", redis, async t => {
  const f = fixture(t); await Promise.all([f.a.ready, f.b.ready]);
  let resets = 0; f.b.onReset(() => { resets++; });
  const list = String(await f.a.command.client("LIST", "TYPE", "PUBSUB"));
  const own = /id=(\d+)/.exec(list.split("\n").find(line => line.includes(`name=${f.b.subscriber.options.connectionName} `)) ?? "")?.[1];
  assert.ok(own);
  await f.cb.cached(async () => "old", f.options);
  await f.a.command.client("KILL", "ID", own);
  f.tick(); await f.ca.invalidate([f.tag]); f.tick();
  assert.equal(await f.cb.cached(async () => "new", f.options), "new");
  for (let i = 0; resets < 2 && i < 100; i++) await delay(20);
  assert.ok(resets >= 2);
});

test("AC3 restart floor: restored entry without tag clocks and render spanning restart are rejected", redis, async t => {
  const f = fixture(t); await Promise.all([f.a.ready, f.b.ready]);
  await f.set("restored", f.a.floor - 1);
  assert.equal(await f.hb.get(f.key, []), undefined);
  await f.ca.cached(async () => "old", f.options);
  // Simulate the independently refreshed INFO floor after an RDB restore.
  f.a.floor = f.now() + 1;
  t.mock.method(f.b.command, "info", async () => "uptime_in_seconds:0\r\n");
  f.b.command.emit("ready"); await f.b.available();
  assert.equal(f.b.floor, f.now() + 1000, "every ready refreshes the Redis restart floor from INFO");
  assert.equal(await f.ca.cached(async () => "new", f.options), "new");
  await f.set("in-flight", f.now());
  assert.equal(await f.hb.get(f.key, []), undefined);
});

test("AC3 real restart", { ...redis, skip: redis.skip || (!process.env.REDIS_RESTART_CMD && "REDIS_RESTART_CMD missing: Claude runs real restart") }, async t => {
  const f = fixture(t); await Promise.all([f.a.ready, f.b.ready]);
  const timestamp = Date.now() - 2_000;
  await f.set("restored", timestamp);
  await promisify(exec)(process.env.REDIS_RESTART_CMD!, { timeout: 15_000 });
  for (let i = 0; i < 200 && f.b.floor <= timestamp; i++) await delay(25);
  assert.ok(f.b.floor > timestamp);
  assert.equal(await f.hb.get(f.key, []), undefined);
});

test("AC4 one render: 100 misses across two handlers; data cache single flight", redis, async t => {
  const f = fixture(t); await Promise.all([f.a.ready, f.b.ready]);
  await f.set(); f.tick(86_400_001);
  let renders = 0;
  const values = await Promise.all(Array.from({ length: 100 }, async (_, i) => {
    const handler = i % 2 ? f.ha : f.hb;
    let hit = await handler.get(f.key, []);
    if (!hit) {
      renders++; await delay(100);
      await handler.set(f.key, Promise.resolve(f.entry("fresh")));
      return "fresh";
    }
    return new Response(hit.value).text();
  }));
  assert.equal(renders, 1); assert.ok(values.every(value => value === "fresh"));
  let calls = 0;
  await Promise.all(Array.from({ length: 100 }, () => f.ca.cached(async () => { calls++; await delay(20); return "data"; }, f.options)));
  assert.equal(calls, 1);
});

test("stale served while locked; TTL expiry is a miss", redis, async t => {
  const f = fixture(t); await Promise.all([f.a.ready, f.b.ready]);
  await f.set(); f.tick(61_000);
  const owner = await f.ha.get(f.key, []), follower = await f.hb.get(f.key, []);
  assert.ok(owner && follower);
  assert.equal(owner.revalidate, 60);
  assert.ok(follower.revalidate * 1000 + follower.timestamp > f.now());
  f.tick(86_400_000);
  assert.equal(await f.hb.get(f.key, []), undefined);
});

test("skew margin; clock monotonic; empty tags respect restart floor", redis, async t => {
  const f = fixture(t); await Promise.all([f.a.ready, f.b.ready]);
  const skewed = createRedisCore(process.env.REDIS_URL!, { now: f.now }); t.after(() => skewed.close()); await skewed.ready;
  await skewed.invalidate([f.tag]);
  const clock = await skewed.expiration([f.tag]);
  assert.equal(clock, f.now() + 1000);
  f.tick(500); await f.set();
  assert.equal(await f.hb.get(f.key, []), undefined);
  await f.a.invalidate([f.tag]);
  assert.equal(await f.a.expiration([f.tag]), clock);
  assert.equal(await f.a.expiration([]), f.a.floor);
  assert.ok(await f.a.command.pttl(`tag:${f.tag}:invalidatedAt`) > 7 * 86_400_000);
});

test("lock expiry & token; hashed keys; partial stream dropped", redis, async t => {
  const f = fixture(t); await Promise.all([f.a.ready, f.b.ready]);
  const key = `${f.key}/奇怪\n|`.repeat(100);
  const lockKey = `lock:${hash(key)}`;
  f.cleanup.push(lockKey, `uc:${hash(key)}`);
  assert.equal(await f.ha.get(key, []), undefined);
  const ttl = await f.a.command.pttl(lockKey);
  assert.ok(ttl > 14_000 && ttl <= 15_000);
  await f.a.command.pexpire(lockKey, 1); await delay(10);
  assert.equal(await f.hb.get(key, []), undefined);
  const otherToken = await f.a.command.get(lockKey);
  await f.ha.set(key, Promise.resolve(f.entry()));
  assert.equal(await f.a.command.get(lockKey), otherToken, "old owner cannot release new owner's lock");
  const broken = f.entry();
  broken.value = new ReadableStream({ start(c) { c.enqueue(Buffer.from("partial")); c.error(Error("broken stream")); } });
  await f.hb.set(key, Promise.resolve(broken));
  assert.equal(await f.a.command.get(lockKey), null);
  assert.equal(await f.a.command.exists(`uc:${hash(key)}`), 1, "failed stream must preserve the previous complete entry");
  assert.equal(await f.a.command.exists(`uc:${key}`), 0);
});

test("errors not cached", redis, async t => {
  const f = fixture(t); await Promise.all([f.a.ready, f.b.ready]);
  await assert.rejects(f.ca.cached(async () => { throw Error("render failed"); }, f.options), /render failed/);
  assert.equal(await f.ca.cached(async () => "retry", f.options), "retry");
});

test("set preserves the caller stream; failed first stream leaves no partial entry", redis, async t => {
  const f = fixture(t); await Promise.all([f.a.ready, f.b.ready]);
  const entry = f.entry("caller still reads");
  await f.ha.set(f.key, Promise.resolve(entry));
  assert.equal(await new Response(entry.value).text(), "caller still reads");
  await f.a.command.del(`uc:${hash(f.key)}`);
  await f.ha.get(f.key, []);
  const broken = f.entry();
  broken.value = new ReadableStream({ start(c) { c.error(Error("stream failed")); } });
  await f.ha.set(f.key, Promise.resolve(broken));
  assert.equal(await f.a.command.exists(`uc:${hash(f.key)}`), 0);
  assert.equal(await f.a.command.exists(`lock:${hash(f.key)}`), 0);
});

test("untagged data obeys restart floor; concurrent invalidated hits render once", redis, async t => {
  const f = fixture(t); await Promise.all([f.a.ready, f.b.ready]);
  const options = { ...f.options, tags: [] };
  await f.ca.cached(async () => "old", options);
  f.a.floor = f.now(); f.tick();
  let calls = 0;
  const values = await Promise.all(Array.from({ length: 100 }, () => f.ca.cached(async () => { calls++; return "new"; }, options)));
  assert.ok(values.every(value => value === "new"));
  assert.equal(calls, 1);
});
