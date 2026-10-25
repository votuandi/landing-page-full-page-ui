import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { sectionRegistry } from "@solar/sections";
import { createPlatformDb } from "../client.ts";
import { forTenant, forPlatform } from "../repository.ts";
import { reserveUpload } from "../media.ts";
import { tenantTransaction } from "../tenantTransaction.ts";
import { createTenantRepo } from "../repository.ts";

const day = 86400_000;
test("orphans: first sweep never deletes; deletes after 30 days; dry-run; re-referenced clears orphanedAt; tenant isolation; skips non-ready", { skip: !process.env.DATABASE_URL }, async () => {
  const db = createPlatformDb({ pool: 2 }), tenantId = randomUUID(), other = randomUUID();
  try {
    for (const id of [tenantId, other]) await db.tenant.create({ data: { id, slug: id, name: "[DỮ LIỆU MẪU]", planId: "premium" } });
    const repo = forTenant(db, tenantId), foreign = forTenant(db, other), platform = forPlatform(db);
    const make = () => repo.media.create({ key: `private/${tenantId}/${randomUUID()}.png`, driver: "local", mime: "image/png", size: 1, status: "ready" });
    const orphan = await make(), reused = await make();
    const pending = await reserveUpload(db, tenantId, { mime: "image/png", size: 1 }, "local");
    const failed = await repo.media.create({ key: `quarantine/${tenantId}/${randomUUID()}`, driver: "local", mime: "image/png", size: 1, status: "failed" });
    const otherRow = await foreign.media.create({ key: `tenants/${other}/keep.png`, driver: "local", mime: "image/png", size: 1, status: "ready" });
    const now = new Date("2026-10-01T00:00:00Z");
    assert.deepEqual(await platform.media.sweepOrphans({ tenantId, now }), []);
    assert.equal((await repo.media.get(orphan.id))?.orphanedAt?.getTime(), now.getTime());
    assert.equal((await foreign.media.get(otherRow.id))?.orphanedAt, null);
    const site = await repo.site.create({ name: "[DỮ LIỆU MẪU]", themeId: "t15" });
    const page = await repo.page.create({ siteId: site.id, slug: "", sections: [] });
    await repo.sectionContent.create({ siteId: site.id, pageId: page.id, sectionId: "hero", type: "hero", data: { ...sectionRegistry.types.hero.defaults, image: { id: reused.id } } });
    assert.equal((await repo.media.get(reused.id))?.orphanedAt, null, "reference writer clears the mark in the same transaction");
    assert.deepEqual(await platform.media.sweepOrphans({ tenantId, now: new Date(+now + 29 * day) }), []);
    assert.equal((await repo.media.get(reused.id))?.orphanedAt, null);
    assert.deepEqual(await platform.media.sweepOrphans({ tenantId, now: new Date(+now + 30 * day) }), [], "exactly 30 days is retained");
    const dry = await platform.media.sweepOrphans({ tenantId, now: new Date(+now + 31 * day), dryRun: true });
    assert.deepEqual(dry.map(row => row.id), [orphan.id]);
    assert.ok(await repo.media.get(orphan.id));
    assert.equal(await repo.auditLog.count({ where: { action: "media.orphan_deleted" } }), 0);
    const removed = await platform.media.sweepOrphans({ tenantId, now: new Date(+now + 31 * day) });
    assert.deepEqual(removed.map(row => row.id), [orphan.id]);
    assert.equal(await repo.media.get(orphan.id), null);
    assert.ok(await repo.media.get(pending.id)); assert.ok(await repo.media.get(failed.id));
    assert.ok(await foreign.media.get(otherRow.id));
    assert.equal(await repo.auditLog.count({ where: { action: "media.orphan_deleted" } }), 1);
  } finally { await db.tenant.deleteMany({ where: { id: { in: [tenantId, other] } } }); await db.$disconnect(); }
});

test("orphans: concurrent reference blocks the sweep, which then keeps the media", { skip: !process.env.DATABASE_URL, timeout: 15_000 }, async () => {
  // Writer transaction + sweep tenant lookup + sweep transaction need separate connections.
  const db = createPlatformDb({ pool: 3 }), tenantId = randomUUID();
  let sweep: Promise<unknown[]> | undefined;
  try {
    await db.tenant.create({ data: { id: tenantId, slug: tenantId, name: "[DỮ LIỆU MẪU]", planId: "premium" } });
    const repo = forTenant(db, tenantId), now = new Date();
    const media = await repo.media.create({ key: `private/${tenantId}/race.png`, driver: "local", mime: "image/png", size: 1, status: "ready", orphanedAt: new Date(+now - 31 * day) });
    const site = await repo.site.create({ name: "[DỮ LIỆU MẪU]", themeId: "t15" });
    const page = await repo.page.create({ siteId: site.id, slug: "", sections: [] });
    // Warm the lazily imported sweep module so the blocked-lock probe below does not race module loading.
    await forPlatform(db).media.sweepOrphans({ tenantId, now, dryRun: true });
    await tenantTransaction(db, tenantId, async tx => {
      const [{ pid }] = await tx.$queryRaw<{ pid: number }[]>`SELECT pg_backend_pid() AS pid`;
      await createTenantRepo(tx, tenantId).sectionContent.create({ siteId: site.id, pageId: page.id, sectionId: "hero", type: "hero", data: { ...sectionRegistry.types.hero.defaults, image: { id: media.id } } });
      sweep = forPlatform(db).media.sweepOrphans({ tenantId, now });
      let blocked = false;
      for (let attempt = 0; attempt < 100; attempt++) {
        // pg_stat_activity is snapshotted per transaction; refresh it or the probe never sees the sweep arrive.
        await tx.$queryRaw`SELECT pg_catalog.pg_stat_clear_snapshot()::text`;
        const [result] = await tx.$queryRaw<{ blocked: boolean }[]>`SELECT EXISTS (SELECT 1 FROM pg_catalog.pg_stat_activity a WHERE ${pid} = ANY(pg_catalog.pg_blocking_pids(a.pid))) AS blocked`;
        if (result.blocked) { blocked = true; break; }
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      assert.ok(blocked, "sweep must reach the row locked by the uncommitted reference write");
    }, { timeout: 10_000 });
    // The sweep waited for the writer's commit, then saw the reference.
    assert.deepEqual(await sweep, []);
    assert.equal((await repo.media.get(media.id))?.orphanedAt, null);
    assert.equal(await repo.auditLog.count({ where: { action: "media.orphan_deleted" } }), 0);
  } finally { await sweep?.catch(() => undefined); await db.tenant.deleteMany({ where: { id: tenantId } }); await db.$disconnect(); }
});

test("orphans: draft, version, backup refs protect; foreign keys ignored", { skip: !process.env.DATABASE_URL }, async () => {
  const db = createPlatformDb({ pool: 2 }), tenantId = randomUUID();
  try {
    await db.tenant.create({ data: { id: tenantId, slug: tenantId, name: "[DỮ LIỆU MẪU]", planId: "premium" } });
    const repo = forTenant(db, tenantId), now = new Date(), old = new Date(+now - 31 * day);
    const rows = await Promise.all(Array.from({ length: 5 }, () => repo.media.create({ key: `tenants/${tenantId}/${randomUUID()}.png`, driver: "local", mime: "image/png", size: 1, status: "ready", visibility: "public", orphanedAt: old })));
    const hero = (id: string) => ({ ...sectionRegistry.types.hero.defaults, image: { id } });
    const site = await repo.site.create({ name: "[DỮ LIỆU MẪU]", themeId: "t15" });
    const page = await repo.page.create({ siteId: site.id, slug: "", sections: [{ id: "legacy", type: "hero", variant: "t15", data: hero(rows[0].id) }], draftSections: [{ id: "draft", type: "hero", variant: "t15", data: hero(rows[1].id) }] });
    await repo.sectionContent.create({ siteId: site.id, pageId: page.id, sectionId: "hero", type: "hero", data: {}, draftData: hero(rows[2].id) });
    await repo.pageVersion.create({ pageId: page.id, revision: 1, snapshot: { contents: [{ type: "hero", data: hero(rows[3].id) }] } });
    assert.deepEqual(await forPlatform(db).media.sweepOrphans({ tenantId, now, protect: new Map([[tenantId, new Set([rows[4].id])]]) }), []);
    for (const row of rows) assert.equal((await repo.media.get(row.id))?.orphanedAt, null);
    const bad = await repo.media.create({ key: `tenants/${tenantId}/x.png`, driver: "local", mime: "image/png", size: 1, status: "ready", orphanedAt: old,
      variants: [{ key: `tenants/${randomUUID()}/foreign.webp`, width: 640, height: 480, size: 1, format: "webp" }] });
    const deleted = await forPlatform(db).media.sweepOrphans({ tenantId, now });
    assert.deepEqual(deleted.find(row => row.id === bad.id)?.keys, [bad.key]);
  } finally { await db.tenant.deleteMany({ where: { id: tenantId } }); await db.$disconnect(); }
});
