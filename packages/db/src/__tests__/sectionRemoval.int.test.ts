import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { createDb, createPlatformDb } from "../client.ts";
import { forTenant } from "../repository.ts";
import { saveDraft, publishPage } from "../publish.ts";
import { sectionRegistry } from "@solar/sections";
import { readFileSync } from "node:fs";
import pg from "pg";

test("removed content is marked only after both draft and published descriptors disappear, and restored without data loss", { skip: !process.env.DATABASE_URL }, async () => {
  const db = createDb({ pool: 2 }), ops = createPlatformDb({ pool: 1 }), tenantId = randomUUID();
  try {
    await ops.tenant.create({ data: { id: tenantId, slug: tenantId, name: "[DỮ LIỆU MẪU]", planId: "premium", status: "active" } });
    const repo = forTenant(db, tenantId), site = await repo.site.create({ name: "[DỮ LIỆU MẪU]", themeId: "t15" });
    const user = await repo.siteUser.create({ name: "[DỮ LIỆU MẪU]", email: "test@example.vn", role: "owner" });
    const actor = { siteUserId: user.id }, descriptor = { id: "hero", type: "hero", variant: "t15", enabled: true };
    const page = await repo.page.create({ siteId: site.id, slug: "", kind: "home", sections: [descriptor], publishedAt: new Date() });
    await repo.page.create({ siteId: site.id, slug: "lien-he", sections: [] });
    const content = await repo.sectionContent.create({ siteId: site.id, pageId: page.id, sectionId: "hero", type: "hero", data: sectionRegistry.types.hero.defaults });
    await saveDraft(db, tenantId, { pageId: page.id, expectedRevision: 0, actor, draftSections: [] });
    assert.equal((await repo.sectionContent.get(content.id))?.removedAt, null, "still published");
    await publishPage(db, tenantId, { pageId: page.id, expectedRevision: 1, actor });
    const removed = await repo.sectionContent.get(content.id);
    assert.ok(removed?.removedAt instanceof Date);
    const snapshot = (await repo.pageVersion.first({ orderBy: { revision: "desc" } }))?.snapshot;
    assert.deepEqual(snapshot, { sections: [], contents: [] }, "latest version cannot keep every deleted content forever");
    await saveDraft(db, tenantId, { pageId: page.id, expectedRevision: 2, actor, draftSections: [descriptor] });
    assert.equal((await repo.sectionContent.get(content.id))?.removedAt, null);
    assert.deepEqual((await repo.sectionContent.get(content.id))?.data, content.data);
  } finally {
    await ops.tenant.deleteMany({ where: { id: tenantId } });
    await Promise.all([db.$disconnect(), ops.$disconnect()]);
  }
});

test("migration backfill marks only orphaned content, including null JSON draft", { skip: !process.env.TEST_OWNER_DATABASE_URL }, async () => {
  const client = new pg.Client({ connectionString: process.env.TEST_OWNER_DATABASE_URL });
  await client.connect();
  try {
    await client.query('CREATE TEMP TABLE "SectionContent" (id text, "tenantId" text, "pageId" text, "sectionId" text, "removedAt" timestamp); CREATE TEMP TABLE "Page" (id text, "tenantId" text, sections jsonb, "draftSections" jsonb)');
    await client.query(`INSERT INTO "Page" VALUES ('p','a','[{"id":"live"}]','null'), ('q','b','[]','[{"id":"draft"}]');
      INSERT INTO "SectionContent" VALUES ('1','a','p','live',NULL), ('2','a','p','gone',NULL), ('3','b','q','draft',NULL), ('4','b','q','gone',NULL)`);
    const migration = readFileSync(new URL("../../prisma/migrations/20261022000000_section_removal/migration.sql", import.meta.url), "utf8");
    await client.query(migration.slice(migration.indexOf('UPDATE "SectionContent"')));
    const rows = await client.query('SELECT id FROM "SectionContent" WHERE "removedAt" IS NOT NULL ORDER BY id');
    assert.deepEqual(rows.rows.map(r => r.id), ["2", "4"]);
  } finally { await client.end(); }
});
