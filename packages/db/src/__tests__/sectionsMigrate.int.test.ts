import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import { createDb, type Db } from "../client.ts";
import { forTenant } from "../repository.ts";
import { runSectionsMigrate } from "../sectionsMigrate.ts";

describe("section data migrations on PostgreSQL", { skip: !process.env.DATABASE_URL && "DATABASE_URL missing: requires migrated Postgres 16" }, () => {
  let db: Db;
  const tenantId = randomUUID(), planId = `migrate-${randomUUID()}`;
  let sectionId: string, versionId: string;
  before(async () => {
    db = createDb({ pool: 2 });
    await db.plan.create({ data: { id: planId, name: "[DỮ LIỆU MẪU] Migration", features: [], limits: {} } });
    await db.tenant.create({ data: { id: tenantId, slug: `migrate-${tenantId}`, name: "[DỮ LIỆU MẪU] Migration", planId } });
    const repo = forTenant(db, tenantId);
    const site = await repo.site.create({ themeId: "t15", name: "[DỮ LIỆU MẪU]" });
    const page = await repo.page.create({ siteId: site.id, slug: "migration", sections: [{ id: "video", type: "shorts" }] });
    const section = await repo.sectionContent.create({ siteId: site.id, pageId: page.id, sectionId: "video", type: "shorts", schemaVersion: 1, data: { custom: "Published" }, draftData: { custom: "Draft" } });
    sectionId = section.id;
    const version = await repo.pageVersion.create({ pageId: page.id, revision: 1, snapshot: { sections: page.sections, contents: [{ sectionId: "video", type: "shorts", schemaVersion: 1, data: { custom: "Snapshot" } }] } });
    versionId = version.id;
  });
  after(async () => {
    if (!db) return;
    try {
      await db.tenant.deleteMany({ where: { id: tenantId } });
      await db.plan.deleteMany({ where: { id: planId } });
    } finally { await db.$disconnect(); }
  });
  test("dry-run leaves two rows untouched; migration upgrades both; second run changes zero", async () => {
    // Only enumerate this fixture tenant; other integration files run concurrently on the same test DB.
    const isolated = new Proxy(db, { get(target, key) {
      if (key === "tenant") return { findMany: () => target.tenant.findMany({ where: { id: tenantId }, select: { id: true } }) };
      return Reflect.get(target, key);
    } });
    const repo = forTenant(db, tenantId);
    const beforeSection = await repo.sectionContent.get(sectionId);
    const beforeVersion = await repo.pageVersion.get(versionId);
    const log: string[] = [];
    assert.deepEqual(await runSectionsMigrate({ db: isolated, dryRun: true, log: (line) => log.push(line) }), { changed: 2, errors: 0 });
    assert.ok(log.some((line) => line.includes("2 changed records")));
    assert.deepEqual(await repo.sectionContent.get(sectionId), beforeSection);
    assert.deepEqual(await repo.pageVersion.get(versionId), beforeVersion);
    assert.deepEqual(await runSectionsMigrate({ db: isolated, log: () => {} }), { changed: 2, errors: 0 });
    const saved = (await repo.sectionContent.get(sectionId))!;
    assert.equal(saved.schemaVersion, 3);
    for (const data of [saved.data, saved.draftData]) {
      assert.deepEqual((data as Record<string, unknown>).channels, []);
      assert.ok((data as Record<string, unknown>).segmentLabels);
    }
    assert.equal((saved.data as Record<string, unknown>).custom, "Published");
    assert.equal((saved.draftData as Record<string, unknown>).custom, "Draft");
    const snapshot = (await repo.pageVersion.get(versionId))!.snapshot as { contents: { schemaVersion: number; data: Record<string, unknown> }[] };
    assert.equal(snapshot.contents[0].schemaVersion, 3);
    assert.equal(snapshot.contents[0].data.custom, "Snapshot");
    assert.deepEqual(snapshot.contents[0].data.channels, []);
    assert.deepEqual(await runSectionsMigrate({ db: isolated, log: () => {} }), { changed: 0, errors: 0 });
  });
});
