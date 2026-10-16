import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { createDb, createPlatformDb, forTenant, saveDraft, publishPage, withTenantTransaction } from "@solar/db";
import { sectionRegistry } from "@solar/sections";
import { createSiteData } from "../siteData";

test("RepeatableRead: 20 publications between layout/content reads never mix versions", { skip: !process.env.DATABASE_URL }, async () => {
  const db = createDb({ pool: 3 }), ops = createPlatformDb({ pool: 1 });
  const tenantId = randomUUID();
  try {
    await ops.tenant.create({ data: { id: tenantId, slug: tenantId, name: "[DỮ LIỆU MẪU] Snapshot", planId: "premium", status: "active" } });
    const repo = forTenant(db, tenantId);
    const site = await repo.site.create({ name: "[DỮ LIỆU MẪU] Snapshot", themeId: "t15" });
    const page = await repo.page.create({ siteId: site.id, slug: "", kind: "home", sections: [] });
    await repo.page.create({ siteId: site.id, slug: "lien-he", sections: [] });
    const user = await repo.siteUser.create({ name: "Owner", role: "owner", email: "owner@test.vn" });
    const actor = { siteUserId: user.id }, hero = sectionRegistry.types.hero;
    let revision = 0;
    const draft = async (i: number) => {
      const marker = `v-${i}`;
      const result = await saveDraft(db, tenantId, { pageId: page.id, expectedRevision: revision, actor,
        draftSections: [{ id: "hero", type: "hero", variant: "t15", anchor: marker }],
        sections: [{ sectionId: "hero", type: "hero", draftData: { ...hero.defaults, title: { ...hero.defaults.title, lead: { vi: marker } } } }] });
      revision = result.revision;
    };
    const publish = async () => { revision = (await publishPage(db, tenantId, { pageId: page.id, expectedRevision: revision, actor })).revision; };
    await draft(0); await publish();
    for (let i = 1; i <= 20; i++) {
      await draft(i);
      let signal!: () => void, resume!: () => void;
      const readLayout = new Promise<void>(resolve => { signal = resolve; });
      const published = new Promise<void>(resolve => { resume = resolve; });
      const data = createSiteData(id => forTenant(db, id), undefined, undefined, (id, work) => withTenantTransaction(db, id,
        repo => work({ ...repo, page: { ...repo.page, first: async args => {
          const row = await repo.page.first(args); signal(); await published; return row;
        } } }), { isolationLevel: "RepeatableRead" }));
      const pending = data.loadPublishedPage(tenantId, site.id, "");
      await Promise.race([readLayout, pending.then(() => { throw new Error("Reader completed before the publication barrier"); })]);
      try { await publish(); } finally { resume(); }
      const read = await pending;
      const section = read?.config.sections[0];
      assert.equal(section?.anchor, `v-${i - 1}`);
      assert.equal(hero.schema.parse(section?.data).title.lead.vi, section?.anchor);
    }
    assert.equal(await repo.pageVersion.count(), 21);
  } finally {
    await ops.tenant.deleteMany({ where: { id: tenantId } });
    await Promise.all([db.$disconnect(), ops.$disconnect()]);
  }
});
