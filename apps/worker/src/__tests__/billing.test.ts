import assert from "node:assert/strict";
import test from "node:test";
import { startBillingCron } from "../billing.ts";

test("billing runs at startup and hourly with the current clock, recovers after failure and stops", async t => {
  const now = new Date("2040-01-01T12:00:00Z").getTime();
  t.mock.timers.enable({ apis: ["Date", "setTimeout"], now });
  t.mock.method(console, "error", () => {});
  const calls: number[] = [];
  const cron = startBillingCron({ async run({ now }) {
    calls.push(now.getTime());
    if (calls.length === 1) throw new Error("database offline");
  } });
  const flush = () => new Promise<void>(resolve => setImmediate(resolve));
  try {
    await flush(); assert.deepEqual(calls, [now]);
    t.mock.timers.tick(3_599_999); await flush(); assert.equal(calls.length, 1);
    t.mock.timers.tick(1); await flush(); assert.deepEqual(calls, [now, now + 3_600_000]);
    t.mock.timers.tick(3_600_000); await flush(); assert.equal(calls.length, 3);
  } finally { await cron.stop(); }
  t.mock.timers.tick(7_200_000); await flush(); assert.equal(calls.length, 3);
});
