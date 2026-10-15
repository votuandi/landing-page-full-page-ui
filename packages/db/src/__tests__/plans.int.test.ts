import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { PLAN_IDS, plans } from "@solar/plans";
import { createPlatformDb, type PlatformDb } from "../client.ts";
import { syncPlans } from "../plans.ts";

test("Postgres sync repairs drift, is idempotent, preserves tenants and unknown plans, and rolls back", {
  skip: !process.env.DATABASE_URL && "DATABASE_URL missing: requires migrated Postgres 16",
}, async () => {
  const db = createPlatformDb({ pool: 2 });
  const id = randomUUID(), extraPlan = `test-plan-${id}`;
  try {
    await syncPlans(db);
    await db.plan.create({ data: { id: extraPlan, name: "External", features: ["unknown"], limits: { users: 42 } } });
    const tenant = await db.tenant.create({ data: { id, slug: `test-sync-${id}`, name: "Test", planId: "pro", addons: ["catalog", "quoteCart"], status: "active" } });
    await db.plan.update({ where: { id: "pro" }, data: { name: "Drift", features: [], limits: {} } });
    await syncPlans(db);
    await syncPlans(db);
    assert.equal(await db.plan.count({ where: { id: { in: [...PLAN_IDS] } } }), 3);
    for (const planId of PLAN_IDS) {
      const row = await db.plan.findUniqueOrThrow({ where: { id: planId } });
      assert.equal(row.name, plans[planId].name);
      assert.deepEqual(row.features, [...plans[planId].features]);
      assert.deepEqual(row.limits, plans[planId].limits);
      assert.ok(row.syncedAt instanceof Date);
    }
    assert.deepEqual(await db.tenant.findUniqueOrThrow({ where: { id } }), tenant);
    const extra = await db.plan.findUniqueOrThrow({ where: { id: extraPlan } });
    assert.equal(extra.name, "External");
    assert.deepEqual(extra.features, ["unknown"]);
    assert.deepEqual(extra.limits, { users: 42 });

    const failingDb = new Proxy(db, { get(target, key) {
      if (key !== "$transaction") return Reflect.get(target, key);
      return (operation: (tx: unknown) => Promise<void>) => db.$transaction(async tx => {
        let writes = 0;
        const failingTx = new Proxy(tx, { get(target, key) {
          if (key !== "plan") return Reflect.get(target, key);
          return { upsert: async (args: Parameters<typeof tx.plan.upsert>[0]) => {
            if (++writes === 2) throw new Error("injected second upsert failure");
            // The first write must be rolled back by syncPlans' own transaction.
            return tx.plan.upsert({ ...args, update: { ...args.update, name: "Rollback marker" } });
          } };
        } });
        return operation(failingTx);
      });
    } });
    await assert.rejects(syncPlans(failingDb), /injected second upsert failure/);
    assert.equal((await db.plan.findUniqueOrThrow({ where: { id: "basic" } })).name, plans.basic.name);
    assert.deepEqual(await db.tenant.findUniqueOrThrow({ where: { id } }), tenant);
  } finally {
    await db.tenant.deleteMany({ where: { id } });
    await db.plan.deleteMany({ where: { id: extraPlan } });
    await db.$disconnect();
  }
});
