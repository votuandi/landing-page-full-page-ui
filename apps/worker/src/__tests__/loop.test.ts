import assert from "node:assert/strict";
import test from "node:test";
import type { OutboxJob } from "@solar/db";
import { every, PermanentError, runOnce, startWorker } from "../loop.ts";

const job = (topic: string, id = "1"): OutboxJob =>
  ({ id, tenantId: null, topic, payload: {}, idempotencyKey: id, attempts: 1, createdAt: new Date(0), runAt: new Date(0) });

test("every runs immediately, never overlaps, recovers from errors and waits on shutdown", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  t.mock.method(console, "error", () => {});
  let calls = 0, release!: () => void;
  const cron = every(300_000, async () => {
    calls++;
    if (calls === 1) throw Error("database down");
    await new Promise<void>(resolve => { release = resolve; });
  });
  const flush = () => new Promise<void>(resolve => setImmediate(resolve));
  await flush(); assert.equal(calls, 1);
  t.mock.timers.tick(300_000); await flush(); assert.equal(calls, 2);
  t.mock.timers.tick(900_000); await flush(); assert.equal(calls, 2);
  let stopped = false;
  const stopping = cron.stop().then(() => { stopped = true; });
  await flush(); assert.equal(stopped, false);
  release(); await stopping;
  t.mock.timers.tick(900_000); await flush(); assert.equal(calls, 2);
});
function fakeOutbox(jobs: OutboxJob[]) {
  const done: string[] = [], failed: { id: string; dead?: boolean; maxAgeMs?: number }[] = [];
  let topics: readonly string[] | undefined;
  return {
    done, failed, topics: () => topics,
    async claim(options: { topics?: readonly string[] }) { topics = options.topics; return jobs.splice(0); },
    async complete(j: OutboxJob) { done.push(j.id); return true; },
    async fail(j: OutboxJob, _error: unknown, options: { dead?: boolean; maxAgeMs?: number } = {}) { failed.push({ id: j.id, dead: options.dead, maxAgeMs: options.maxAgeMs }); return "retry" as const; },
  };
}

test("runOnce claims only handled topics and settles each job by outcome", async () => {
  const outbox = fakeOutbox([job("a", "ok"), job("a", "boom"), job("b", "perm")]);
  const count = await runOnce({ outbox, topics: {
    a: { handle: async (j) => { if (j.id === "boom") throw new Error("500"); } },
    b: { handle: async () => { throw new PermanentError("unknown channel"); }, maxAgeMs: Infinity },
  } });
  assert.equal(count, 3);
  assert.deepEqual(outbox.topics(), ["a", "b"]);
  assert.deepEqual(outbox.done, ["ok"]);
  assert.deepEqual(outbox.failed, [{ id: "boom", dead: false, maxAgeMs: undefined }, { id: "perm", dead: true, maxAgeMs: Infinity }]);
});

test("startWorker keeps polling and stop() waits for the batch in flight", async () => {
  let release!: () => void, handled = 0;
  const outbox = fakeOutbox([job("a")]);
  const worker = startWorker({ outbox, intervalMs: 5, topics: { a: { handle: () => new Promise<void>((resolve) => { handled++; release = resolve; }) } } });
  await new Promise((resolve) => setTimeout(resolve, 20));
  const stopping = worker.stop();
  release();
  await stopping;
  assert.equal(handled, 1);
  assert.deepEqual(outbox.done, ["1"]);
});

test("runOnce waits for every job before reporting a settle failure (worker stops cleanly)", async () => {
  let release!: () => void, slowDone = false;
  const outbox = fakeOutbox([job("a", "broken"), job("a", "slow")]);
  outbox.complete = async (j: OutboxJob) => { if (j.id === "broken") throw new Error("db blip"); outbox.done.push(j.id); return true; };
  outbox.fail = async () => { throw new Error("db blip"); };
  const run = runOnce({ outbox, topics: { a: { handle: async (j) => {
    if (j.id !== "slow") return;
    await new Promise<void>((resolve) => { release = resolve; });
    slowDone = true;
  } } } });
  let settled = false;
  void run.catch(() => undefined).finally(() => { settled = true; });
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(settled, false, "batch still running while the slow handler sends");
  release();
  await assert.rejects(run, /db blip/);
  assert.equal(slowDone, true);
  assert.deepEqual(outbox.done, ["slow"]);
});

test("startWorker survives a failing claim (database down) and delivers once it recovers", async (t) => {
  t.mock.method(console, "error", () => {});
  const outbox = fakeOutbox([job("a", "after-recovery")]);
  const claim = outbox.claim;
  let calls = 0;
  outbox.claim = async (options) => { if (++calls === 1) throw new Error("ECONNREFUSED"); return claim(options); };
  const worker = startWorker({ outbox, intervalMs: 1, topics: { a: { handle: async () => {} } } });
  for (let i = 0; i < 50 && !outbox.done.length; i++) await new Promise((resolve) => setTimeout(resolve, 5));
  await worker.stop();
  assert.ok(calls >= 2);
  assert.deepEqual(outbox.done, ["after-recovery"]);
});
