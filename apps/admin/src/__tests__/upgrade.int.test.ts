import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { createDb, createPlatformDb, forTenant } from "@solar/db";
import { recordUpgradeRequest } from "../lib/upgradeAudit.ts";

test("upgrade AuditLog: concurrent dedup, tenant isolation, actor and message", {
  skip: !process.env.DATABASE_URL || !process.env.PLATFORM_DATABASE_URL ? "requires PostgreSQL; Claude chạy sau" : false,
}, async () => {
  const db = createDb({ pool: 4 }), ops = createPlatformDb({ pool: 2 });
  const a = randomUUID(), b = randomUUID(), actorId = randomUUID(), planId = `upgrade-${a}`;
  try {
    await ops.plan.create({ data: { id: planId, name: "[DỮ LIỆU MẪU]", features: [], limits: {} } });
    for (const id of [a, b]) await ops.tenant.create({ data: { id, slug: `upgrade-${id}`, name: "[DỮ LIỆU MẪU]", planId } });
    const input = { tenantId: a, actorId, feature: "shorts", message: "Tư vấn \"gói\"\n☀" }, since = new Date(Date.now() - 86_400_000);
    await Promise.all([recordUpgradeRequest(db, input, since), recordUpgradeRequest(db, input, since)]);
    const rows = await forTenant(db, a).auditLog.list({ where: { action: "plan.upgrade_requested" } });
    assert.equal(rows.length, 1); assert.equal(rows[0].tenantId, a); assert.equal(rows[0].actorType, "site_user"); assert.equal(rows[0].actorId, actorId);
    assert.deepEqual(rows[0].data, { feature: input.feature, message: input.message });
    assert.equal(await forTenant(db, b).auditLog.count(), 0);
    await recordUpgradeRequest(db, { ...input, tenantId: b }, since);
    assert.equal(await forTenant(db, b).auditLog.count(), 1);
    await recordUpgradeRequest(db, { ...input, feature: "theme:signature" }, since);
    assert.equal(await forTenant(db, a).auditLog.count(), 2);
  } finally {
    await ops.tenant.deleteMany({ where: { id: { in: [a, b] } } });
    await ops.plan.deleteMany({ where: { id: planId } });
    await db.$disconnect(); await ops.$disconnect();
  }
});
