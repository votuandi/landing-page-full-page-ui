import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { createDb, createPlatformDb, forPlatform, forTenant, withTenantTransaction } from "@solar/db";

test("cleanup keeps recent, referenced, restored and latest-snapshot content; parallel workers delete once with audit", { skip: !process.env.DATABASE_URL }, async () => {
  const db = createDb({ pool: 2 }), ops = createPlatformDb({ pool: 2 }), tenantId = randomUUID();
  try {
    await ops.tenant.create({ data: { id: tenantId, slug: tenantId, name: "[DỮ LIỆU MẪU]", planId: "premium", status: "active" } });
    const repo = forTenant(db, tenantId), site = await repo.site.create({ name: "[DỮ LIỆU MẪU]", themeId: "t15" });
    const page = await repo.page.create({ siteId: site.id, slug: "", kind: "home", sections: [{ id: "referenced" }] });
    const now = new Date(), daysAgo = (days: number) => new Date(now.getTime() - days * 86400000);
    for (const [sectionId, removedAt] of [["expired", daysAgo(31)], ["recent", daysAgo(29)], ["boundary", daysAgo(30)], ["snapshot", daysAgo(40)], ["referenced", daysAgo(40)], ["restored", null]] as const) {
      await repo.sectionContent.create({ siteId: site.id, pageId: page.id, sectionId, type: "hero", data: {}, removedAt });
    }
    await repo.pageVersion.create({ pageId: page.id, revision: 1, snapshot: { sections: [], contents: [{ sectionId: "expired" }] } });
    await repo.pageVersion.create({ pageId: page.id, revision: 2, snapshot: { sections: [], contents: [{ sectionId: "snapshot" }] } });
    await Promise.all([forPlatform(ops).sectionContents.purgeRemoved({ now }), forPlatform(ops).sectionContents.purgeRemoved({ now })]);
    assert.deepEqual((await repo.sectionContent.list({ orderBy: { sectionId: "asc" } })).map(c => c.sectionId), ["boundary", "recent", "referenced", "restored", "snapshot"]);
    assert.equal(await repo.auditLog.count({ where: { action: "section-content.purge" } }), 1);
    const race = await repo.sectionContent.create({ siteId: site.id, pageId: page.id, sectionId: "race", type: "hero", data: {}, removedAt: daysAgo(40) });
    let release!: () => void, locked!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; }), ready = new Promise<void>(resolve => { locked = resolve; });
    const restore = withTenantTransaction(db, tenantId, async tx => {
      await tx.page.update(page.id, { revision: { increment: 1 } });
      await tx.sectionContent.update(race.id, { removedAt: null });
      locked(); await gate;
    });
    await ready;
    const purge = forPlatform(ops).sectionContents.purgeRemoved({ now });
    release(); await Promise.all([restore, purge]);
    assert.equal((await repo.sectionContent.get(race.id))?.removedAt, null, "cleanup rechecks a row restored after candidate selection");
  } finally {
    await ops.tenant.deleteMany({ where: { id: tenantId } });
    await Promise.all([db.$disconnect(), ops.$disconnect()]);
  }
});
