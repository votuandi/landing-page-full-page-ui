import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import { createDb, type Db } from "../client.ts";
import { MissingTenantError } from "../tenantScope.ts";
import { CrossTenantRefError } from "../refs.ts";
import { forTenant, forPlatform } from "../repository.ts";

describe("tenant repository on PostgreSQL", { skip: !process.env.DATABASE_URL && "DATABASE_URL missing: requires migrated Postgres 16" }, () => {
  let db: Db;
  const a = randomUUID(), b = randomUUID(), planId = `repo-${randomUUID()}`;
  const projectB = randomUUID(), mediaB = randomUUID(), siteA = randomUUID(), pageA = randomUUID();
  before(async () => {
    db = createDb({ pool: 2 });
    await db.plan.create({ data: { id: planId, name: "Test", features: [], limits: {} } });
    for (const id of [a, b]) await db.tenant.create({ data: { id, slug: `repo-${id}`, name: "[DỮ LIỆU MẪU]", planId } });
    await db.project.create({ data: { id: projectB, tenantId: b, slug: "shared", title: { vi: "B" } } });
    await db.media.create({ data: { id: mediaB, tenantId: b, key: `tenants/${b}/test`, driver: "local", mime: "image/png", size: 1 } });
    await db.site.create({ data: { id: siteA, tenantId: a, themeId: "t15", name: "Test" } });
    await db.page.create({ data: { id: pageA, tenantId: a, siteId: siteA, slug: "", sections: [] } });
  });
  after(async () => {
    if (!db) return;
    try {
      await db.tenant.deleteMany({ where: { id: { in: [a, b] } } });
      await db.plan.delete({ where: { id: planId } });
    } finally { await db.$disconnect(); }
  });
  test("unscoped model queries and all raw operations fail before SQL", async () => {
    for (const query of [db.project.findMany(), db.project.findUnique({ where: { id: projectB } }), db.project.count(), db.project.deleteMany({}), db.$queryRaw`SELECT 1`, db.$executeRaw`SELECT 1`, db.$queryRawUnsafe("SELECT 1"), db.$executeRawUnsafe("SELECT 1")]) {
      await assert.rejects(query, MissingTenantError);
    }
  });
  test("required and optional model clients reject unsafe tenant filters and create data", async () => {
    for (const tenantId of [{ not: a }, { in: [] }, {}, { equals: a, not: b }, { in: [a, null] }]) {
      await assert.rejects(db.project.findMany({ where: { tenantId: tenantId as never } }), MissingTenantError);
      await assert.rejects(db.outbox.deleteMany({ where: { tenantId: tenantId as never } }), MissingTenantError);
      await assert.rejects(db.auditLog.findMany({ where: { tenantId: tenantId as never } }), MissingTenantError);
      await assert.rejects(db.project.create({ data: { tenantId } as never }), MissingTenantError);
      await assert.rejects(db.outbox.create({ data: { tenantId } as never }), MissingTenantError);
      await assert.rejects(db.auditLog.create({ data: { tenantId } as never }), MissingTenantError);
    }
    assert.deepEqual(await db.auditLog.findMany({ where: { tenantId: { in: [a, b] } } }), []);
  });
  test("client updates and upserts cannot move B into A", async () => {
    const where = { tenantId_id: { tenantId: b, id: projectB } };
    await assert.rejects(db.project.update({ where, data: { tenantId: a } }), MissingTenantError);
    await assert.rejects(db.project.update({ where, data: { tenant: { connect: { id: a } } } }), MissingTenantError);
    await assert.rejects(db.project.updateMany({ where: { tenantId: { equals: b }, id: projectB }, data: { tenantId: a } }), MissingTenantError);
    await assert.rejects(db.project.updateManyAndReturn({ where: { tenantId: { in: [b] } }, data: { tenantId: a } }), MissingTenantError);
    await assert.rejects(db.project.upsert({ where, create: { tenantId: a, slug: "forged-upsert", title: {} }, update: {} }), MissingTenantError);
    await assert.rejects(db.project.upsert({ where, create: { tenantId: b, slug: "forged-upsert", title: {} }, update: { tenantId: a } }), MissingTenantError);
    await assert.rejects(db.project.upsert({ where, create: { tenantId: b, slug: "forged-upsert", title: {} }, update: { tenant: { connect: { id: a } } } }), MissingTenantError);
    assert.equal((await db.project.update({ where, data: { tenantId: b } })).tenantId, b);
    assert.equal((await db.project.upsert({ where, create: { tenantId: b, slug: "same-tenant", title: {} }, update: { tenant: { connect: { id: b } } } })).tenantId, b);
    assert.deepEqual((await forTenant(db, b).project.get(projectB))?.title, { vi: "B" });
    assert.equal(await forTenant(db, a).project.count({ where: { slug: "forged-upsert" } }), 0);
  });
  test("A cannot read, update or delete B, including malicious filters and data", async () => {
    const repo = forTenant(db, a);
    const own = await repo.project.create({ slug: "shared", title: { vi: "A" }, tenantId: b, tenant: { connect: { id: b } } } as unknown as Parameters<typeof repo.project.create>[0]);
    assert.equal(own.tenantId, a);
    assert.equal(await repo.project.get(projectB), null);
    assert.deepEqual(await repo.project.update(projectB, { title: { vi: "changed" } }), { count: 0 });
    assert.deepEqual(await repo.project.delete(projectB), { count: 0 });
    assert.deepEqual((await repo.project.list({ where: { slug: "shared" } })).map((row) => row.id), [own.id]);
    const forgedFilter = { where: { tenantId: b } } as unknown as Parameters<typeof repo.project.list>[0];
    assert.deepEqual((await repo.project.list(forgedFilter)).map((row) => row.id), [own.id]);
    assert.equal(await repo.project.count(), 1);
    assert.equal((await repo.project.first())?.id, own.id);
    assert.deepEqual(await repo.project.list({ where: { OR: [{ tenantId: b }] } }), []);
    await repo.project.update(own.id, { title: { vi: "updated" }, tenantId: { set: b }, tenant: { connect: { id: b } } } as unknown as Parameters<typeof repo.project.update>[1]);
    assert.equal((await repo.project.get(own.id))?.tenantId, a);
    assert.deepEqual((await forTenant(db, b).project.get(projectB))?.title, { vi: "B" });
    assert.deepEqual(await repo.project.delete(own.id), { count: 1 });
  });
  test("JSON media and collection references are checked on create and update", async () => {
    const repo = forTenant(db, a);
    await assert.rejects(repo.project.create({ slug: "foreign-json", title: {}, data: { image: { id: mediaB } } }), CrossTenantRefError);
    const section = { siteId: siteA, pageId: pageA, sectionId: "refs", type: "projects", schemaVersion: 1, data: {} };
    for (const data of [{ query: { ids: [projectB] } }, { items: [{ image: { id: mediaB } }] }]) {
      await assert.rejects(repo.sectionContent.create({ ...section, data }), CrossTenantRefError);
      await assert.rejects(repo.sectionContent.create({ ...section, draftData: data }), CrossTenantRefError);
    }
    assert.equal(await repo.sectionContent.count(), 0);
    assert.equal(await repo.project.count({ where: { slug: "foreign-json" } }), 0);
    const own = await repo.sectionContent.create(section);
    await assert.rejects(repo.sectionContent.update(own.id, { data: { query: { ids: [projectB] } } }), CrossTenantRefError);
    await assert.rejects(repo.sectionContent.update(own.id, { draftData: { items: [{ image: { id: mediaB } }] } }), CrossTenantRefError);
    assert.deepEqual((await repo.sectionContent.get(own.id))?.data, {});
    assert.deepEqual(await repo.sectionContent.update(randomUUID(), { data: { query: { ids: [projectB] } } }), { count: 0 });
    const localMedia = await repo.media.create({ key: `tenants/${a}/own`, driver: "local", mime: "image/png", size: 1 });
    const localProject = await repo.project.create({ slug: "own-json", title: {}, data: { image: { id: localMedia.id } } });
    await assert.rejects(repo.project.update(localProject.id, { data: { image: { id: mediaB } } }), CrossTenantRefError);
    assert.deepEqual((await repo.project.get(localProject.id))?.data, { image: { id: localMedia.id } });
    assert.deepEqual(await repo.sectionContent.update(own.id, {
      data: { query: { ids: [localProject.id] }, items: [{ image: { id: localMedia.id } }, { image: { id: "/images/static.jpg" } }] },
    }), { count: 1 });
  });
  test("repositories use the caller transaction and roll back writes", async () => {
    await assert.rejects(db.$transaction(async (tx) => {
      const repo = forTenant(tx, a);
      const row = await repo.project.create({ slug: "transaction", title: {} });
      assert.equal((await repo.project.get(row.id))?.tenantId, a);
      await assert.rejects(repo.project.create({ slug: "foreign-tx", title: {}, data: { image: { id: mediaB } } }), CrossTenantRefError);
      throw new Error("rollback");
    }), /rollback/);
    assert.equal(await forTenant(db, a).project.count({ where: { slug: "transaction" } }), 0);
  });
  test("platform exposes hostname lookup without weakening tenant queries", async () => {
    const hostname = `${a}.repo.localhost`;
    await forTenant(db, a).domain.create({ hostname, siteId: siteA, verificationToken: "test" });
    assert.equal((await forPlatform(db).domains.findByHostname(hostname))?.tenantId, a);
    await assert.rejects(db.domain.findUnique({ where: { hostname } }), MissingTenantError);
  });
});

test("repository rejects invalid tenant UUIDs without connecting", async () => {
  const db = createDb({ url: "postgresql://localhost/unused", pool: 1 });
  try {
    for (const value of ["", "A", " "]) assert.throws(() => forTenant(db, value), /UUID/);
  } finally { await db.$disconnect(); }
});
