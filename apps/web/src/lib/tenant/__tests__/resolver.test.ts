import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { performance } from "node:perf_hooks";
import { test } from "node:test";
import type { HostRecord } from "@solar/db";
import { createHostResolver, type InvalidationBus, type SharedStore } from "../resolver";

export const record: HostRecord = { hostname: "a.localhost", tenantId: "tenant-a", siteId: "site-a", status: "active", isPrimary: true, tenantStatus: "active", primaryHost: "a.localhost" };
function shared() {
  const values = new Map<string, string>();
  const events = new EventEmitter();
  const store: SharedStore = {
    get: async (key) => values.get(key) ?? null,
    set: async (key, value) => { values.set(key, value); },
    del: async (keys) => { keys.forEach((key) => values.delete(key)); },
  };
  const bus: InvalidationBus = {
    publish: async (hosts) => { events.emit("invalidate", hosts); },
    subscribe: (callback) => { events.on("invalidate", callback); },
  };
  return { store, bus, values };
}

test("memory and negative caching, TTL refresh and shared cache freshness are bounded by 60 seconds", async () => {
  let time = 0, calls = 0;
  const { store } = shared();
  const lookup = async (host: string) => { calls++; return host === record.hostname ? record : null; };
  const resolver = createHostResolver({ lookup, store, now: () => time });
  assert.deepEqual(await resolver.resolve(record.hostname), record);
  await resolver.resolve(record.hostname);
  assert.equal(calls, 1);
  const second = createHostResolver({ lookup, store, now: () => time });
  await second.resolve(record.hostname);
  assert.equal(calls, 1);
  await resolver.resolve("missing.localhost");
  await resolver.resolve("missing.localhost");
  assert.equal(calls, 2);
  time = 60_001;
  await second.resolve(record.hostname);
  await resolver.resolve("missing.localhost");
  assert.equal(calls, 4, "Redis must not resurrect an expired DB snapshot");
});

test("coalesces concurrent misses and retries after lookup rejection", async () => {
  let calls = 0;
  const resolver = createHostResolver({ lookup: async () => { calls++; await new Promise((r) => setTimeout(r, 5)); return record; } });
  const results = await Promise.all(Array.from({ length: 20 }, () => resolver.resolve(record.hostname)));
  assert.equal(calls, 1);
  assert.ok(results.every((value) => value?.tenantId === record.tenantId));
  const failing = createHostResolver({ lookup: async () => { if (calls++ === 1) throw new Error("DB unavailable"); return record; } });
  await assert.rejects(failing.resolve(record.hostname), /DB unavailable/);
  assert.deepEqual(await failing.resolve(record.hostname), record);
});

test("invalidation reaches two instances for primary changes, removal and negative cache", async () => {
  const { store, bus } = shared();
  let current: HostRecord | null = record;
  const a = createHostResolver({ lookup: async () => current, store, bus });
  const b = createHostResolver({ lookup: async () => current, store, bus });
  await a.resolve(record.hostname);
  await b.resolve(record.hostname);
  for (const next of [{ ...record, primaryHost: "new.localhost", isPrimary: false }, { ...record, status: "removed" as const }, null, record]) {
    current = next;
    await a.invalidate([record.hostname]);
    assert.deepEqual(await b.resolve(record.hostname), next);
  }
});

test("lost pub/sub still refreshes by 60s, reconnect clears memory and Redis failures fall back to DB", async () => {
  let time = 0, current = record;
  const { store, bus } = shared();
  const a = createHostResolver({ lookup: async () => current, store, now: () => time });
  const b = createHostResolver({ lookup: async () => current, store, bus, now: () => time });
  await a.resolve(record.hostname);
  await b.resolve(record.hostname);
  current = { ...record, status: "removed" };
  time = 60_001;
  assert.deepEqual(await a.resolve(record.hostname), current);
  current = record;
  await store.del([`tenancy:host:${record.hostname}`]);
  await bus.publish([]); // Empty list means subscriber reconnected: discard all local snapshots.
  assert.deepEqual(await b.resolve(record.hostname), record);
  const broken: SharedStore = { get: async () => { throw Error(); }, set: async () => { throw Error(); }, del: async () => { throw Error(); } };
  const down = createHostResolver({ lookup: async () => current, store: broken, bus: { subscribe: () => { throw Error(); }, publish: async () => { throw Error(); } } });
  assert.deepEqual(await down.resolve(record.hostname), record);
  await down.invalidate([record.hostname]);
  current = { ...record, status: "removed" };
  assert.deepEqual(await down.resolve(record.hostname), current);
});

test("invalidation during an outstanding lookup cannot restore a stale entry", async () => {
  let release!: (value: HostRecord) => void, calls = 0;
  const { store, bus } = shared();
  const next = { ...record, status: "removed" as const };
  const resolver = createHostResolver({ store, bus, lookup: async () => ++calls === 1 ? new Promise<HostRecord>((r) => { release = r; }) : next });
  const pending = resolver.resolve(record.hostname);
  await new Promise((r) => setImmediate(r));
  await resolver.invalidate([record.hostname]);
  release(record);
  assert.deepEqual(await pending, next);
  assert.deepEqual(await resolver.resolve(record.hostname), next);
});

test("memory has a 10,000 entry limit and cached lookup p95 is below 5ms", async (t) => {
  let calls = 0;
  const resolver = createHostResolver({ lookup: async (hostname) => { calls++; return { ...record, hostname }; } });
  for (let i = 0; i <= 10_000; i++) await resolver.resolve(`${i}.localhost`);
  await resolver.resolve("0.localhost");
  assert.equal(calls, 10_002);
  const timings: number[] = [];
  for (let i = 0; i < 10_000; i++) {
    const start = performance.now();
    await resolver.resolve("0.localhost");
    timings.push(performance.now() - start);
  }
  const p95 = timings.sort((a, b) => a - b)[9499];
  t.diagnostic(`memory resolution p95: ${p95.toFixed(4)} ms (10,000 hits)`);
  assert.ok(p95 <= 5);
});
