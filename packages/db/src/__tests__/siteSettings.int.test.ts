import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { sectionRegistry } from "@solar/sections";
import { createDb, createPlatformDb, forTenant } from "../index.ts";
import { saveSiteSettings, SiteSettingsError } from "../siteSettings.ts";

test("site settings transaction invariants", { skip: !(process.env.DATABASE_URL && process.env.PLATFORM_DATABASE_URL) && "requires local PostgreSQL" }, async t => {
  const db = createDb({ pool: 2 }), ops = createPlatformDb({ pool: 2 });
  const tenantId = randomUUID(), otherId = randomUUID();
  for (const id of [tenantId, otherId]) await ops.tenant.create({ data: { id, slug: `settings-${id}`, name: "[DỮ LIỆU MẪU]", planId: "premium", status: "active" } });
  const repo = forTenant(db, tenantId);
  try {
    const site = await repo.site.create({ name: "[DỮ LIỆU MẪU]", themeId: "t15" });
    const page = await repo.page.create({ siteId: site.id, slug: "", sections: [{ id: "hero", type: "hero", variant: "t15", enabled: true }], draftSections: [{ id: "hero", type: "hero", variant: "t14", enabled: true }] });
    const content = await repo.sectionContent.create({ siteId: site.id, pageId: page.id, sectionId: "hero", type: "hero", data: sectionRegistry.types.hero.defaults, draftData: sectionRegistry.types.hero.defaults });
    await t.test("save enqueues tenant tag", async () => {
      await saveSiteSettings(db, tenantId, site.id, { profile: { name: "Mới" } }, site.updatedAt);
      assert.ok(JSON.stringify((await repo.outbox.list())[0].payload).includes(`tenant:${tenantId}`));
    });
    await t.test("stale updatedAt is rejected", async () => {
      await assert.rejects(saveSiteSettings(db, tenantId, site.id, { profile: {} }, site.updatedAt), (e: unknown) => e instanceof SiteSettingsError && e.status === 409);
      assert.equal((await repo.site.get(site.id))?.profile && ((await repo.site.get(site.id))!.profile as { name: string }).name, "Mới");
    });
    await t.test("other tenant site is not found", async () => {
      await assert.rejects(saveSiteSettings(db, otherId, site.id, { profile: {} }), (e: unknown) => e instanceof SiteSettingsError && e.status === 404);
    });
    await t.test("changing theme keeps section content", async () => {
      await saveSiteSettings(db, tenantId, site.id, { themeId: "t14" });
      assert.deepEqual(await repo.page.get(page.id), page);
      assert.deepEqual(await repo.sectionContent.get(content.id), content);
    });
  } finally {
    await ops.tenant.deleteMany({ where: { id: { in: [tenantId, otherId] } } });
    await Promise.all([db.$disconnect(), ops.$disconnect()]);
  }
});

test("I3: live site profile publishes team media, including quarantine, in the settings transaction", { skip: !process.env.DATABASE_URL }, async () => {
  const db = createDb({ pool: 2 }), ops = createPlatformDb({ pool: 1 }), tenantId = randomUUID();
  try {
    await ops.tenant.create({ data: { id: tenantId, slug: tenantId, name: "[DỮ LIỆU MẪU]", planId: "premium", status: "active" } });
    const repo = forTenant(db, tenantId), site = await repo.site.create({ name: "[DỮ LIỆU MẪU]", themeId: "t15" });
    const rows = [];
    for (const status of ["ready", "quarantine", "failed"] as const) rows.push(await repo.media.create({ key: `${status === "ready" ? "private" : "quarantine"}/${tenantId}/${randomUUID()}`, driver: "local", mime: "image/png", size: 10, status, visibility: "private" }));
    const profile = { team: rows.map(row => ({ name: "[DỮ LIỆU MẪU]", role: "[DỮ LIỆU MẪU]", image: row.id })) };
    await saveSiteSettings(db, tenantId, site.id, { profile }, site.updatedAt);
    const jobs = await repo.outbox.list({ where: { topic: "media.publish" } });
    assert.deepEqual(jobs.map(job => (job.payload as { id: string }).id).sort(), rows.slice(0, 2).map(row => row.id).sort());
    const saved = (await repo.site.get(site.id))!;
    await assert.rejects(saveSiteSettings(db, tenantId, site.id, { profile: { team: [] } }, site.updatedAt), { status: 409 });
    assert.deepEqual((await repo.site.get(site.id))?.profile, saved.profile);
    assert.equal(await repo.outbox.count({ where: { topic: "media.publish" } }), 2);
    await saveSiteSettings(db, tenantId, site.id, { themeId: "t14" });
    assert.equal(await repo.outbox.count({ where: { topic: "media.publish" } }), 2, "retained live profile is deduplicated");
  } finally { await ops.tenant.deleteMany({ where: { id: tenantId } }); await Promise.all([db.$disconnect(), ops.$disconnect()]); }
});
