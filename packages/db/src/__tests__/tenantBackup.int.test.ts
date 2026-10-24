import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { createDb, createPlatformDb } from "../client.ts";
import { forTenant } from "../repository.ts";
import { seedDemoTenant } from "../../prisma/seed-demo.ts";
import { COLLECTIONS } from "../collections.ts";
import { collectionRepository } from "../collectionWrite.ts";
import { migrateSectionRow } from "../sectionContent.ts";
import { exportTenant, restoreTenant, type BackupStorage, type TenantBackup } from "../tenantBackup.ts";

function memoryStorage() {
  const files = new Map<string, Uint8Array>();
  const storage: BackupStorage = { get: async key => files.get(key) ?? null,
    put: async (key, bytes) => { files.set(key, bytes); }, delete: async key => { files.delete(key); } };
  return { files, storage };
}
// Compare IDs by their stable position, including references nested inside snapshots/JSON.
function normalized(bundle: TenantBackup) {
  const ids = new Map<string, string>();
  for (const [group, rows] of Object.entries({ site: [bundle.site], pages: bundle.pages, pageVersions: bundle.pageVersions,
    sectionContents: bundle.sectionContents, media: bundle.media, ...bundle.collections })) {
    for (const [index, row] of rows.entries()) ids.set(row.id, `${group}:${index}`);
  }
  function walk(value: unknown): unknown {
    if (typeof value === "string") return ids.get(value) ?? value.replaceAll(`tenants/${bundle.source.tenantId}/`, "tenants/normalized/");
    if (Array.isArray(value)) return value.map(walk);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !["createdAt", "updatedAt"].includes(key)).map(([key, v]) => [key, walk(v)]));
    return value;
  }
  const { source: _source, exportedAt: _exportedAt, ...content } = bundle;
  return walk(content);
}

test("tenant backup integration", { skip: !process.env.DATABASE_URL, timeout: 120_000 }, async t => {
  const ops = createPlatformDb({ pool: 2 }), runtime = createDb({ pool: 2 }), tenants = new Set<string>();
  const clonePrefix = `bk-${randomUUID().slice(0, 8)}-`;
  // Other integration files create tenants concurrently; rollback assertions only count this test's clones.
  const countClones = () => ops.tenant.count({ where: { slug: { startsWith: clonePrefix } } });
  const restore = async (bundle: TenantBackup, storage: BackupStorage, slug = `${clonePrefix}${randomUUID()}`) => {
    const result = await restoreTenant(ops, storage, bundle, { slug, planId: "premium" }); tenants.add(result.tenantId); return result;
  };
  try {
    for (const id of ["t15", "t12"] as const) {
      const slug = `backup-${randomUUID()}`;
      const tenantId = await seedDemoTenant(ops, { id, slug, hostname: `${slug}.localhost`, password: "backup-test-password" });
      tenants.add(tenantId);
      const repo = forTenant(runtime, tenantId), { storage, files } = memoryStorage();
      const key = `tenants/${tenantId}/2026/10/a.webp`;
      files.set(key, new Uint8Array([1, 2, 3]));
      const media = await repo.media.create({ key, driver: "local", mime: "image/webp", size: 3, status: "ready" });
      const root = await repo.productCategory.create({ slug: "root", title: { vi: "Gốc" } });
      const child = await repo.productCategory.create({ slug: "child", title: { vi: "Con" }, parentId: root.id });
      await repo.productCategory.create({ slug: "grandchild", title: { vi: "Cháu" }, parentId: child.id });
      const owner = (await repo.siteUser.first({ where: { role: "owner" } }))!;
      await repo.siteSession.create({ siteUserId: owner.id, audience: "admin", kind: "user", tokenHash: randomUUID(), expiresAt: new Date(Date.now() + 60_000) });
      await repo.siteToken.create({ siteUserId: owner.id, purpose: "reset_password", tokenHash: randomUUID(), expiresAt: new Date(Date.now() + 60_000) });
      await repo.leadIntegration.create({ name: "Secret adapter", kind: "webhook", configEncrypted: "backup-secret-sentinel" });
      const published = (await repo.pageVersion.first())!;
      await repo.pageVersion.update(published.id, { publishedBySiteUserId: owner.id });
      const site = (await repo.site.first())!;
      await repo.site.update(site.id, { profile: { ...site.profile as object, nestedMedia: { id: media.id, url: `https://cdn.test/${key}` } } });
      const bundle = await exportTenant(runtime, tenantId);
      await t.test(`${id}: export covers every content model`, async () => {
        assert.equal(bundle.site.id, site.id);
        for (const name of COLLECTIONS) assert.equal(bundle.collections[name].length, await collectionRepository(repo, name).count(), name);
        assert.equal(bundle.pages.length, await repo.page.count());
        assert.equal(bundle.pageVersions.length, await repo.pageVersion.count());
        assert.equal(bundle.sectionContents.length, await repo.sectionContent.count());
        assert.equal(bundle.media.length, 1);
      });
      await t.test(`${id}: export excludes accounts, sessions and secrets`, () => {
        assert.doesNotMatch(JSON.stringify(bundle), /passwordHash|siteUser|owner@demo.vn|tokenHash|configEncrypted|backup-secret-sentinel/);
        assert.ok(bundle.pageVersions.every(row => row.publishedBySiteUserId === null));
      });
      const clone = await restore(bundle, storage), cloned = forTenant(runtime, clone.tenantId);
      await t.test(`${id}: restore round-trips demo tenants`, async () => assert.deepEqual(normalized(await exportTenant(runtime, clone.tenantId)), normalized(bundle)));
      await t.test(`${id}: restore creates no accounts`, async () => {
        assert.equal(await cloned.siteUser.count(), 0); assert.equal(await cloned.siteSession.count(), 0); assert.equal(await cloned.siteToken.count(), 0);
        for (const version of await cloned.pageVersion.list()) { assert.equal(version.publishedBySiteUserId, null); assert.equal(version.publishedByPlatformAdminId, null); }
      });
      await t.test(`${id}: restore writes audit log`, async () => assert.equal(await cloned.auditLog.count({ where: { action: "tenant.backup.restore" } }), 1));
      await t.test(`${id}: category tree survives restore`, async () => {
        const child = (await cloned.productCategory.first({ where: { slug: "child" } }))!;
        assert.equal((await cloned.productCategory.get(child.parentId!))?.slug, "root"); assert.notEqual(child.parentId, root.id);
        const grandchild = (await cloned.productCategory.first({ where: { slug: "grandchild" } }))!;
        assert.equal(grandchild.parentId, child.id);
      });
      await t.test(`${id}: existing slug is rejected before writes`, async () => {
        const before = files.size;
        await assert.rejects(restore(bundle, storage, clone.slug), (e: unknown) => e instanceof Error && "status" in e && e.status === 409);
        assert.equal(files.size, before);
      });
      await t.test(`${id}: missing media file aborts restore`, async () => {
        const before = await countClones(); const broken = structuredClone(bundle);
        broken.media.push({ ...bundle.media[0], id: randomUUID(), key: `tenants/${tenantId}/missing.webp` });
        const keys = [...files.keys()];
        await assert.rejects(restore(broken, storage), /Không tìm thấy tệp/);
        assert.equal(await countClones(), before); assert.deepEqual([...files.keys()], keys);
      });
      await t.test(`${id}: dangling ref rolls back restore`, async () => {
        const broken = structuredClone(bundle), section = broken.sectionContents.find(s => s.type === "projects")!;
        section.data = { ...section.data as object, query: { collection: "projects", ids: [randomUUID()], limit: 3, filter: {} } };
        const count = await countClones(), keys = [...files.keys()];
        await assert.rejects(restore(broken, storage)); assert.equal(await countClones(), count); assert.deepEqual([...files.keys()], keys);
      });
      await t.test(`${id}: restore keeps schemaVersion`, async () => {
        const legacy = structuredClone(bundle); legacy.sectionContents[0].schemaVersion = 1;
        const target = await restore(legacy, storage);
        const restored = (await forTenant(runtime, target.tenantId).sectionContent.first({ where: { sectionId: legacy.sectionContents[0].sectionId } }))!;
        assert.equal(restored.schemaVersion, 1);
        assert.ok(migrateSectionRow(restored).schemaVersion >= 1, "legacy content remains readable through lazy migration");
      });
      await t.test(`${id}: dangling collection media and snapshot refs roll back`, async () => {
        for (const kind of ["collection", "snapshot"] as const) {
          const broken = structuredClone(bundle), missing = randomUUID();
          if (kind === "collection") broken.collections.product[0].data = { ...broken.collections.product[0].data as object, images: [missing] };
          else {
            const snapshot = broken.pageVersions[0].snapshot as { contents: { type: string; data: object }[] };
            const section = snapshot.contents.find(s => s.type === "projects")!;
            section.data = { ...section.data, query: { collection: "projects", ids: [missing], limit: 3, filter: {} } };
          }
          const count = await countClones(), keys = [...files.keys()];
          await assert.rejects(restore(broken, storage), /Bản sao lưu.*tham chiếu/);
          assert.equal(await countClones(), count); assert.deepEqual([...files.keys()], keys);
        }
      });
      await t.test(`${id}: variant files including nested URLs are copied`, async () => {
        const variantKey = `tenants/${tenantId}/2026/10/a-small.webp`, variant = structuredClone(bundle);
        files.set(variantKey, new Uint8Array([4]));
        variant.media[0].variants = { thumbnail: { url: `https://cdn.test/${variantKey}` } };
        const target = await restore(variant, storage);
        assert.deepEqual(files.get(`tenants/${target.tenantId}/2026/10/a-small.webp`), new Uint8Array([4]));
      });
      await t.test(`${id}: storage write failure cleans partial files and leaves no tenant`, async () => {
        const count = await countClones(), keys = [...files.keys()];
        await assert.rejects(restore(bundle, { ...storage, put: async (key, bytes, options) => {
          await storage.put(key, bytes, options); throw new Error("write failed");
        } }), /write failed/);
        assert.equal(await countClones(), count); assert.deepEqual([...files.keys()], keys);
      });
      await t.test(`${id}: preserves JSON null in required content columns`, async () => {
        const nullable = structuredClone(bundle);
        nullable.collections.product[0].title = null; nullable.collections.product[0].data = null;
        const target = await restore(nullable, storage), exported = await exportTenant(runtime, target.tenantId);
        assert.equal(exported.collections.product[0].title, null); assert.equal(exported.collections.product[0].data, null);
      });
      await t.test(`${id}: source tenant untouched`, async () => {
        const after = await exportTenant(runtime, tenantId); after.exportedAt = bundle.exportedAt; assert.deepEqual(after, bundle);
      });
    }
  } finally {
    for (const tenantId of tenants) await ops.tenant.delete({ where: { id: tenantId } });
    await Promise.all([ops.$disconnect(), runtime.$disconnect()]);
  }
});
