import assert from "node:assert/strict";
import test from "node:test";
import { renewalDays, runBillingCron } from "../billing.ts";
import { createDb, type PlatformDb } from "../client.ts";
import { forPlatform } from "../repository.ts";

test("renewal selects only the smallest due milestone, including a plan assigned with five days left", () => {
  const now = new Date("2040-01-01T12:00:00Z");
  for (const [days, expected] of [[15, null], [14, 14], [7.001, 14], [7, 7], [5, 7], [1.001, 7], [1, 1], [0.5, 1], [0, null], [-1, null]] as const) {
    assert.equal(renewalDays(new Date(now.getTime() + days * 86_400_000), now), expected, `remaining ${days} days`);
  }
});

test("billing rejects runtime credentials and invalid clocks without querying the database", async () => {
  const db = createDb({ url: "postgresql://app_runtime:unused@localhost/unused", pool: 1 });
  try {
    assert.equal("billing" in forPlatform(db), false);
    await assert.rejects(runBillingCron(db as PlatformDb), /forPlatform requires createPlatformDb credentials/);
    await assert.rejects(runBillingCron(db as PlatformDb, { now: new Date(NaN) }), /Invalid billing scan time/);
  } finally { await db.$disconnect(); }
});
