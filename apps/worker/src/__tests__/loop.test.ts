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
