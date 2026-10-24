import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { sectionRegistry } from "@solar/sections";
import { siteTag } from "@solar/cache";
import { createDb, createPlatformDb, internalClient } from "../client.ts";
import { tenantTransaction } from "../tenantTransaction.ts";
import { forTenant } from "../repository.ts";
import { mediaReferences, updateMediaMeta, deleteMedia, MediaInUseError } from "../mediaLibrary.ts";
import { reserveUpload } from "../media.ts";

test("mediaReferences covers sections drafts collections site; delete in-use media requires confirm; cross tenant", { skip: !process.env.DATABASE_URL }, async () => {
  const db = createDb({ pool: 2 }), ops = createPlatformDb({ pool: 1 }), tenantId = randomUUID(), other = randomUUID();
  try {
    for (const id of [tenantId, other]) await ops.tenant.create({ data: { id, slug: id, name: "[DỮ LIỆU MẪU]", planId: "premium", status: "active" } });
    const repo = forTenant(db, tenantId), foreign = forTenant(db, other);
    const make = (status: "ready" | "failed" = "ready") => repo.media.create({ key: `tenants/${tenantId}/${randomUUID()}.png`, driver: "local", mime: "image/png", size: 1, status, visibility: "public" });
    const image = await make(), draft = await make();
    const site = await repo.site.create({ name: "[DỮ LIỆU MẪU]", themeId: "t15", profile: { brand: { favicon: image.id } } });
    const page = await repo.page.create({ siteId: site.id, slug: "", title: { vi: "Trang chủ" }, sections: [] });
    await repo.sectionContent.create({ siteId: site.id, pageId: page.id, sectionId: "hero", type: "hero", data: { ...sectionRegistry.types.hero.defaults, image: { id: image.id } }, draftData: { ...sectionRegistry.types.hero.defaults, image: { id: draft.id } } });
    const removed = await repo.sectionContent.create({ siteId: site.id, pageId: page.id, sectionId: "removed", type: "hero", data: { ...sectionRegistry.types.hero.defaults, image: { id: draft.id } }, removedAt: new Date() });
    const project = await repo.project.create({ slug: "sample", title: { vi: "[DỮ LIỆU MẪU]" }, coverMediaId: image.id, data: { images: [image.id] } });
    await repo.product.create({ slug: "sample", title: { vi: "[DỮ LIỆU MẪU]" }, data: { images: [draft.id] } });
    const refs = await mediaReferences(repo, [image.id, draft.id]);
    assert.deepEqual(refs.get(image.id)?.map(u => u.kind).sort(), ["collection", "section", "site"]);
    assert.equal(refs.get(draft.id)?.length, 2);
    assert.ok(refs.get(draft.id)?.some(u => u.label.includes("(bản nháp)")));
    assert.ok(!refs.get(draft.id)?.some(u => u.href.includes(removed.id)));
    assert.equal((await mediaReferences(foreign, [image.id])).size, 0);
    assert.equal(await foreign.media.get(image.id), null);
    for (const operation of [() => updateMediaMeta(db, other, image.id, { alt: { vi: "Ảnh" } }), () => deleteMedia(db, other, image.id, { confirm: true })]) await assert.rejects(operation, { status: 404 });
    await assert.rejects(deleteMedia(db, tenantId, image.id, { confirm: false }), e => e instanceof MediaInUseError && e.status === 409 && e.uses.length === 3);
    assert.ok(await repo.media.get(image.id));
    const result = await deleteMedia(db, tenantId, image.id, { confirm: true });
    assert.deepEqual(result.keys, [image.key]);
    assert.equal(await repo.media.get(image.id), null); assert.equal((await repo.project.get(project.id))?.coverMediaId, null);
    assert.equal(await repo.auditLog.count({ where: { action: "media.deleted" } }), 1);
    const job = await repo.outbox.first({ where: { topic: "invalidate" } });
    assert.ok(JSON.stringify(job?.payload).includes(siteTag(tenantId)));
    // JSON refs deliberately survive confirmed deletion and remain visible to the editor.
    assert.ok(JSON.stringify((await repo.site.get(site.id))?.profile).includes(image.id));
    await deleteMedia(db, tenantId, (await make("failed")).id, { confirm: false });
    const pending = await reserveUpload(db, tenantId, { mime: "image/png", size: 1 }, "local");
    await assert.rejects(deleteMedia(db, tenantId, pending.id, { confirm: true }), { status: 409 });
  } finally {
    await ops.tenant.deleteMany({ where: { id: { in: [tenantId, other] } } });
    await Promise.all([db.$disconnect(), ops.$disconnect()]);
  }
});

test("delete returns original and variant keys, clears every FK, private has no invalidation", { skip: !process.env.DATABASE_URL }, async () => {
  const db = createDb({ pool: 2 }), ops = createPlatformDb({ pool: 1 }), tenantId = randomUUID();
  try {
    await ops.tenant.create({ data: { id: tenantId, slug: tenantId, name: "[DỮ LIỆU MẪU]", planId: "premium", status: "active" } });
    const repo = forTenant(db, tenantId), key = `private/${tenantId}/a.png`;
    const variant = { key: `private/${tenantId}/a-w640.webp`, format: "webp", width: 640, height: 480, size: 1 };
    const media = await repo.media.create({ key, driver: "local", mime: "image/png", size: 1, status: "ready", visibility: "private", variants: [variant] });
    const common = { slug: "sample", title: { vi: "[DỮ LIỆU MẪU]" } };
    const post = await repo.post.create({ ...common, coverMediaId: media.id });
    const story = await repo.story.create({ ...common, posterMediaId: media.id });
    const brand = await repo.brand.create({ ...common, logoMediaId: media.id });
    await assert.rejects(deleteMedia(db, tenantId, media.id, { confirm: false }), MediaInUseError);
    assert.deepEqual((await deleteMedia(db, tenantId, media.id, { confirm: true })).keys, [key, variant.key]);
    assert.equal((await repo.post.get(post.id))?.coverMediaId, null);
    assert.equal((await repo.story.get(story.id))?.posterMediaId, null);
    assert.equal((await repo.brand.get(brand.id))?.logoMediaId, null);
    assert.equal(await repo.outbox.count({ where: { topic: "invalidate" } }), 0);
  } finally { await ops.tenant.deleteMany({ where: { id: tenantId } }); await Promise.all([db.$disconnect(), ops.$disconnect()]); }
});

test("concurrent FK attachment aborts deletion with 409 and retains media", { skip: !process.env.DATABASE_URL, timeout: 15000 }, async () => {
  const db = createDb({ pool: 2 }), ops = createPlatformDb({ pool: 1 }), tenantId = randomUUID();
  let deletion: Promise<void> | undefined;
  try {
    await ops.tenant.create({ data: { id: tenantId, slug: tenantId, name: "[DỮ LIỆU MẪU]", planId: "premium", status: "active" } });
    const repo = forTenant(db, tenantId);
    const row = await repo.media.create({ key: `private/${tenantId}/race.png`, driver: "local", mime: "image/png", size: 1, status: "ready", visibility: "private" });
    await tenantTransaction(db, tenantId, async tx => {
      const [{ pid }] = await tx.$queryRaw<{ pid: number }[]>`SELECT pg_backend_pid() AS pid`;
      await tx.project.create({ data: { tenantId, slug: "race", title: { vi: "[DỮ LIỆU MẪU]" }, coverMediaId: row.id } });
      // The new FK holds a key-share lock while deletion scans an earlier committed snapshot.
      deletion = assert.rejects(deleteMedia(db, tenantId, row.id, { confirm: false }), { status: 409 });
      let blocked = false;
      for (let attempt = 0; attempt < 100; attempt++) {
        const [result] = await internalClient(ops).$queryRaw<{ blocked: boolean }[]>`SELECT EXISTS (SELECT 1 FROM pg_catalog.pg_stat_activity a WHERE ${pid} = ANY(pg_catalog.pg_blocking_pids(a.pid))) AS blocked`;
        if (result.blocked) { blocked = true; break; }
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      assert.ok(blocked, "delete must reach the FK lock before attachment commits");
    }, { timeout: 10000 });
    await deletion;
    assert.ok(await repo.media.get(row.id));
    assert.equal((await repo.project.first({ where: { slug: "race" } }))?.coverMediaId, row.id);
    assert.equal(await repo.auditLog.count({ where: { action: "media.deleted" } }), 0);
  } finally {
    await deletion?.catch(() => undefined);
    await ops.tenant.deleteMany({ where: { id: tenantId } }); await Promise.all([db.$disconnect(), ops.$disconnect()]);
  }
});

test("upload display name persists while quarantine key stays generated", { skip: !process.env.DATABASE_URL }, async () => {
  const db = createDb({ pool: 1 }), ops = createPlatformDb({ pool: 1 }), tenantId = randomUUID();
  try {
    await ops.tenant.create({ data: { id: tenantId, slug: tenantId, name: "[DỮ LIỆU MẪU]", planId: "basic", status: "active" } });
    const row = await reserveUpload(db, tenantId, { mime: "image/png", size: 1, name: "../a\u0000.png" }, "local");
    assert.equal(row.name, "..a.png"); assert.ok(row.key.startsWith(`quarantine/${tenantId}/`)); assert.ok(!row.key.includes("a.png"));
  } finally { await ops.tenant.deleteMany({ where: { id: tenantId } }); await Promise.all([db.$disconnect(), ops.$disconnect()]); }
});

test("image alt required; update meta focal; empty English omitted; audit", { skip: !process.env.DATABASE_URL }, async () => {
  const db = createDb({ pool: 2 }), ops = createPlatformDb({ pool: 1 }), tenantId = randomUUID();
  try {
    await ops.tenant.create({ data: { id: tenantId, slug: tenantId, name: "[DỮ LIỆU MẪU]", planId: "basic", status: "active" } });
    const repo = forTenant(db, tenantId);
    for (const mime of ["image/png", "application/pdf"]) {
      const row = await repo.media.create({ key: `private/${tenantId}/${randomUUID()}`, driver: "local", mime, size: 1, status: "ready", visibility: "private" });
      const save = (vi: string, x = 0.2) => updateMediaMeta(db, tenantId, row.id, { alt: { vi, en: " " }, focal: { x, y: 0.8 } });
      if (mime === "image/png") await assert.rejects(save(" "), { status: 400 }); else await save("");
      for (const x of [-0.1, 1.5, NaN]) await assert.rejects(save("Ảnh", x), { status: 400 });
      await assert.rejects(save("a".repeat(251)), { status: 400 });
      await save(" Mái nhà ");
      const saved = await repo.media.get(row.id);
      assert.deepEqual(saved?.alt, { vi: "Mái nhà" }); assert.deepEqual(saved?.focal, { x: 0.2, y: 0.8 });
    }
    assert.equal(await repo.auditLog.count({ where: { action: "media.updated" } }), 3);
  } finally { await ops.tenant.deleteMany({ where: { id: tenantId } }); await Promise.all([db.$disconnect(), ops.$disconnect()]); }
});
