import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { createDb, createPlatformDb, forTenant, saveSiteSettings } from "@solar/db";
import { createAppearanceHandlers, type AppearanceDeps } from "../lib/appearance.ts";
import { setup } from "./siteSettings.test.ts";

test("brand favicon uses tenant RLS, publishes private media and font writes conflict", { skip: !process.env.DATABASE_URL || !process.env.PLATFORM_DATABASE_URL }, async () => {
  const db = createDb({ pool: 3 }), ops = createPlatformDb({ pool: 1 });
  const tenantId = randomUUID(), otherId = randomUUID();
  try {
    for (const id of [tenantId, otherId]) await ops.tenant.create({ data: { id, slug: id, name: "[DỮ LIỆU MẪU]", planId: "premium", status: "active" } });
    const repo = forTenant(db, tenantId), foreign = forTenant(db, otherId);
    const site = await repo.site.create({ name: "[DỮ LIỆU MẪU]", themeId: "t15", profile: { brand: { logo: "/logo.svg" } } });
    const media = await repo.media.create({ key: `private/${tenantId}/icon.png`, driver: "local", mime: "image/png", size: 10, status: "ready", visibility: "private" });
    const other = await foreign.media.create({ key: `private/${otherId}/icon.png`, driver: "local", mime: "image/png", size: 10, status: "ready", visibility: "private" });
    const s = setup(); s.context.tenantId = tenantId; s.context.session = { ...s.context.session!, tenantId };
    const deps: AppearanceDeps = {
      ...s.deps, tenant: async () => ({ tenantId, siteId: site.id }),
      load: async (id, sid) => { const row = await forTenant(db, id).site.get(sid); return row ? { ...row, planId: "premium" } : null; },
      save: (id, sid, patch, expected) => saveSiteSettings(db, id, sid, patch, expected),
      media: (id, mid) => forTenant(db, id).media.get(mid),
    };
    const handlers = createAppearanceHandlers(deps);
    const input = (data: unknown, updatedAt = site.updatedAt) => ({ payload: JSON.stringify(data), updatedAt: updatedAt.toISOString() });
    assert.equal((await handlers.favicon(input({ favicon: other.id }), s.context)).status, 404);
    assert.deepEqual((await repo.site.get(site.id))?.profile, site.profile);
    assert.equal((await handlers.favicon(input({ favicon: media.id }), s.context)).ok, true);
    const jobs = await repo.outbox.list({ where: { topic: "media.publish" } });
    assert.equal(jobs.length, 1); assert.equal((jobs[0].payload as { id: string }).id, media.id);
    assert.ok(JSON.stringify(await repo.outbox.list({ where: { topic: "invalidate" } })).includes(`tenant:${tenantId}`));
    const updated = (await repo.site.get(site.id))!;
    const results = await Promise.all(["Manrope", "Inter"].map(sans => handlers.fonts(input({ sans }, updated.updatedAt), s.context)));
    assert.equal(results.filter(result => result.ok).length, 1);
    assert.equal(results.filter(result => result.status === 409).length, 1);
  } finally {
    await ops.tenant.deleteMany({ where: { id: { in: [tenantId, otherId] } } });
    await Promise.all([db.$disconnect(), ops.$disconnect()]);
  }
});
