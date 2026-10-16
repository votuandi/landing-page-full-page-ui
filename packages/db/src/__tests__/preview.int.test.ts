import assert from "node:assert/strict";
import test from "node:test";
import { createHash, randomUUID } from "node:crypto";
import { createDb, createPlatformDb } from "../client.ts";
import { forTenant, forPlatform } from "../repository.ts";
import { createPreviewToken, consumePreviewToken } from "../preview.ts";

test("preview tokens are hashed, tenant scoped, expiring and consumed exactly once", { skip: !process.env.DATABASE_URL }, async () => {
  const db = createDb({ pool: 3 }), ops = createPlatformDb({ pool: 1 });
  const a = randomUUID(), b = randomUUID(), plan = `preview-${a}`;
  try {
    await ops.plan.create({ data: { id: plan, name: "Test", features: [], limits: {} } });
    for (const id of [a, b]) await ops.tenant.create({ data: { id, slug: id, name: "Test", planId: plan } });
    const site = await forTenant(db, a).site.create({ name: "Test", themeId: "t15" });
    assert.deepEqual(await forPlatform(db).tenants.bySlug(a), { tenantId: a, siteId: site.id, tenantStatus: "trial" });
    assert.deepEqual(await forPlatform(ops).tenants.bySlug(a), await forPlatform(db).tenants.bySlug(a));
    assert.equal(await forPlatform(db).tenants.bySlug(b), null);
    const token = await createPreviewToken(db, a, site.id);
    assert.match(token, /^[A-Za-z0-9_-]{43}$/);
    assert.equal((await forTenant(db, a).previewToken.first())?.tokenHash, createHash("sha256").update(token).digest("hex"));
    assert.equal(await consumePreviewToken(db, b, token), null);
    const consumed = await Promise.all([consumePreviewToken(db, a, token), consumePreviewToken(db, a, token)]);
    assert.deepEqual(consumed.filter(Boolean), [{ siteId: site.id }]);
    assert.equal(await consumePreviewToken(db, a, token), null);
    const expired = await createPreviewToken(db, a, site.id, { ttlMs: 1 });
    const row = await forTenant(db, a).previewToken.first({ where: { tokenHash: createHash("sha256").update(expired).digest("hex") } });
    await forTenant(db, a).previewToken.update(row!.id, { expiresAt: new Date(0) });
    assert.equal(await consumePreviewToken(db, a, expired), null);
    assert.equal(await consumePreviewToken(db, a, "invalid"), null);
    await assert.rejects(createPreviewToken(db, b, site.id));
  } finally {
    await ops.tenant.deleteMany({ where: { id: { in: [a, b] } } });
    await ops.plan.deleteMany({ where: { id: plan } });
    await Promise.all([db.$disconnect(), ops.$disconnect()]);
  }
});
