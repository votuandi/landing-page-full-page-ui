import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { createDb, createPlatformDb } from "../client.ts";
import { forTenant } from "../repository.ts";
import { setPageTypes } from "../siteStructure.ts";
import { publishPage } from "../publish.ts";
import { sectionRegistry } from "@solar/sections";

test("page catalog: disable/re-enable preserves data, creates drafts, rejects stale writes and plan violations", { skip: !process.env.DATABASE_URL }, async () => {
  const db = createDb({ pool: 2 }), ops = createPlatformDb({ pool: 1 }), tenantId = randomUUID();
  const required = ["home", "contact", "policy"];
  try {
    await ops.tenant.create({ data: { id: tenantId, slug: tenantId, name: "[DỮ LIỆU MẪU]", planId: "premium", status: "active" } });
    const repo = forTenant(db, tenantId), site = await repo.site.create({ name: "[DỮ LIỆU MẪU]", themeId: "t15", presetId: "t15", pageTypes: [...required, "about"] });
    const home = await repo.page.create({ siteId: site.id, slug: "", kind: "home", sections: [] });
    await repo.page.create({ siteId: site.id, slug: "lien-he", sections: [] });
    const about = await repo.page.create({ siteId: site.id, slug: "ve-chung-toi", sections: [] });
    const content = await repo.sectionContent.create({ siteId: site.id, pageId: about.id, sectionId: "about-story", type: "about-story", data: sectionRegistry.types["about-story"].defaults });
    const user = await repo.siteUser.create({ name: "[DỮ LIỆU MẪU]", email: "test@example.vn", role: "owner" });
    await setPageTypes(db, tenantId, { siteId: site.id, pageTypes: required, expected: site.pageTypes });
    assert.ok(await repo.page.get(about.id), "disabling about keeps page and content");
    assert.deepEqual(await repo.sectionContent.get(content.id), content);
    assert.match(JSON.stringify((await repo.outbox.list())[0]?.payload), new RegExp(`tenant:${tenantId}:site`));
    await publishPage(db, tenantId, { pageId: home.id, expectedRevision: 0, actor: { siteUserId: user.id } });
    await assert.rejects(setPageTypes(db, tenantId, { siteId: site.id, pageTypes: required, expected: site.pageTypes }), /Tải lại/);
    await setPageTypes(db, tenantId, { siteId: site.id, pageTypes: [...required, "about", "guides"], expected: required });
    assert.equal(await repo.page.count({ where: { slug: "ve-chung-toi" } }), 1);
    assert.deepEqual(await repo.sectionContent.get(content.id), content);
    assert.equal((await repo.page.first({ where: { slug: "cam-nang" } }))?.publishedAt, null, "enabling creates draft page");
    await assert.rejects(setPageTypes(db, tenantId, { siteId: site.id, pageTypes: ["home", "policy"], expected: [...required, "about", "guides"] }), /Thiếu trang bắt buộc/);
    await ops.tenant.update({ where: { id: tenantId }, data: { featureOverrides: { catalog: { on: false, reason: "Test" } } } });
    await assert.rejects(setPageTypes(db, tenantId, { siteId: site.id, pageTypes: [...required, "about", "guides", "products"], expected: [...required, "about", "guides"] }), /Trang ngoài gói/);
    const competing = await Promise.allSettled(["services", "projects"].map(type => setPageTypes(db, tenantId, {
      siteId: site.id, pageTypes: [...required, "about", "guides", type], expected: [...required, "about", "guides"],
    })));
    assert.equal(competing.filter(result => result.status === "fulfilled").length, 1);
    assert.equal(competing.filter(result => result.status === "rejected").length, 1);
    const current = (await repo.site.get(site.id))!.pageTypes;
    await ops.tenant.update({ where: { id: tenantId }, data: { planId: "basic" } });
    await assert.rejects(setPageTypes(db, tenantId, { siteId: site.id, pageTypes: required, expected: current }), /Gói không cho đổi cấu trúc trang/);
    await assert.rejects(setPageTypes(db, randomUUID(), { siteId: site.id, pageTypes: required, expected: required }), /Không tìm thấy/);
  } finally {
    await ops.tenant.deleteMany({ where: { id: tenantId } });
    await Promise.all([db.$disconnect(), ops.$disconnect()]);
  }
});

test("enabling a missing system page creates draft descriptors and default content from presetStructure", { skip: !process.env.DATABASE_URL }, async () => {
  const db = createDb({ pool: 2 }), ops = createPlatformDb({ pool: 1 }), tenantId = randomUUID();
  try {
    await ops.tenant.create({ data: { id: tenantId, slug: tenantId, name: "[DỮ LIỆU MẪU]", planId: "premium", status: "active" } });
    const repo = forTenant(db, tenantId), site = await repo.site.create({ name: "[DỮ LIỆU MẪU]", themeId: "t15", presetId: "t15" });
    await repo.page.create({ siteId: site.id, slug: "", kind: "home", sections: [] });
    await repo.page.create({ siteId: site.id, slug: "lien-he", sections: [] });
    await setPageTypes(db, tenantId, { siteId: site.id, pageTypes: [...site.pageTypes, "about"], expected: site.pageTypes });
    const about = await repo.page.first({ where: { slug: "ve-chung-toi" } });
    assert.ok(about); assert.equal(about.publishedAt, null);
    assert.deepEqual((about.sections as { type: string }[]).map(s => s.type), ["about-story", "stats", "trust", "warranty"]);
    const contents = await repo.sectionContent.list({ where: { pageId: about.id } });
    assert.equal(contents.length, 4);
    for (const content of contents) assert.deepEqual(content.data, sectionRegistry.getType(content.type)!.defaults);
  } finally {
    await ops.tenant.deleteMany({ where: { id: tenantId } });
    await Promise.all([db.$disconnect(), ops.$disconnect()]);
  }
});
