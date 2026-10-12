import assert from "node:assert/strict";
import test from "node:test";
import { PLAN_IDS, plans } from "@solar/plans";
import { syncPlans } from "../plans.ts";
import type { Db } from "../client.ts";

test("sync uses one transaction and only three Plan upserts with fresh serialization", async () => {
  const calls: { where: { id: string }; create: Record<string, unknown>; update: Record<string, unknown> }[] = [];
  let transactions = 0;
  const db = { $transaction: async (operation: (tx: unknown) => Promise<void>) => {
    transactions++;
    await operation({ plan: { upsert: async (args: typeof calls[number]) => { calls.push(args); } } });
  } } as unknown as Db;
  await syncPlans(db);
  assert.equal(transactions, 1);
  assert.deepEqual(calls.map(call => call.where.id), PLAN_IDS);
  calls.forEach((call, index) => {
    const id = PLAN_IDS[index];
    assert.deepEqual(call.update, { name: plans[id].name, features: [...plans[id].features], limits: { ...plans[id].limits }, syncedAt: call.update.syncedAt });
    assert.ok(call.update.syncedAt instanceof Date);
    assert.deepEqual(call.create, { id, ...call.update });
    assert.notEqual(call.update.limits, plans[id].limits);
  });
  (calls[0].update.features as string[]).push("builder");
  (calls[0].update.limits as { users: number }).users = 99;
  assert.equal(plans.basic.features.has("builder"), false);
  assert.equal(plans.basic.limits.users, 1);
});

test("upsert failure rejects the transaction without continuing", async () => {
  let writes = 0;
  const db = { $transaction: async (operation: (tx: unknown) => Promise<void>) => operation({
    plan: { upsert: async () => { if (++writes === 2) throw new Error("upsert failed"); } },
  }) } as unknown as Db;
  await assert.rejects(syncPlans(db), /upsert failed/);
  assert.equal(writes, 2);
});
