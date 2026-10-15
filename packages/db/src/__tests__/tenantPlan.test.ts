import assert from "node:assert/strict";
import test from "node:test";
import { changeTenantPlan, scanExpiredOverrides, tenantPlanChangesSchema, expiredOverrideDates } from "../tenantPlan.ts";
import { createDb, type PlatformDb } from "../client.ts";
import { forPlatform } from "../repository.ts";

test("runtime credentials cannot use platform plan mutations even through a type cast", async () => {
  const db = createDb({ url: "postgresql://app_runtime:unused@localhost/unused", pool: 1 });
  try {
    assert.equal("tenants" in forPlatform(db), false);
    await assert.rejects(changeTenantPlan(db as PlatformDb, {
      actorId: "00000000-0000-4000-8000-000000000001", tenantId: "00000000-0000-4000-8000-000000000002", changes: { planId: "basic" },
    }), /forPlatform requires createPlatformDb credentials/);
    await assert.rejects(scanExpiredOverrides(db as PlatformDb), /forPlatform requires createPlatformDb credentials/);
  } finally { await db.$disconnect(); }
});

test("plan changes reject unknown fields/features, malformed overrides and non-JSON policies", () => {
  for (const changes of [{ planId: "free" }, { addons: ["bad"] }, { status: "active" },
    { featureOverrides: { calculator: { on: true } } }, { limitOverrides: { users: { add: -1, reason: "x" } } },
    { permissionPolicy: [] }, { permissionPolicy: { value: undefined } }]) {
    assert.equal(tenantPlanChangesSchema.safeParse(changes).success, false);
  }
  assert.deepEqual(tenantPlanChangesSchema.parse({ addons: ["shorts", "shorts"] }), { addons: ["shorts"] });
  assert.deepEqual(tenantPlanChangesSchema.parse({ permissionPolicy: { roles: ["editor"], nested: { enabled: true } } }),
    { permissionPolicy: { roles: ["editor"], nested: { enabled: true } } });
});

test("expiry window is (now - 24h, now], normalized, deduplicated and ignores malformed entries", () => {
  const now = new Date("2026-10-15T12:00:00Z");
  assert.deepEqual(expiredOverrideDates({
    calculator: { on: true, reason: "x", until: "2026-10-15T12:00:00Z" },
    shorts: { on: false, reason: "x", until: "2026-10-15T19:00:00+07:00" },
    blog: { on: true, reason: "x", until: "2026-10-14T12:00:00Z" },
    catalog: { on: true, reason: "x", until: "2026-10-15T12:00:01Z" },
    bad: { until: "2026-10-15T11:00:00Z" },
  }, { users: { add: 1, reason: "x", until: "2026-10-15T11:00:00Z" } }, now),
  ["2026-10-15T11:00:00.000Z", "2026-10-15T12:00:00.000Z"]);
  assert.deepEqual(expiredOverrideDates(null, [], now), []);
});
