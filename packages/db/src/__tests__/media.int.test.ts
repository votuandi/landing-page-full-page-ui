import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { createDb, createPlatformDb } from "../client.ts";
import { forTenant, forPlatform } from "../repository.ts";
import { reserveUpload, mediaUsage, cancelUpload, completeUpload, promoteMedia, rejectMedia, expireStaleMedia, publishMedia, MediaQuotaError, MediaError } from "../media.ts";
import { sectionRegistry } from "@solar/sections";
import { publishPage, saveDraft } from "../publish.ts";
import { collectionDefs } from "../collections.ts";
import { saveCollectionItem } from "../collectionWrite.ts";

test("file video refs publish independently of poster and reject cross-tenant sources", { skip: !process.env.DATABASE_URL }, async () => {
  const db = createDb({ pool: 3 }), ops = createPlatformDb({ pool: 1 }), tenantId = randomUUID(), other = randomUUID();
  try {
    for (const id of [tenantId, other]) await ops.tenant.create({ data: { id, slug: id, name: "[DỮ LIỆU MẪU]", planId: "premium", status: "active" } });
    const repo = forTenant(db, tenantId);
    const makeVideo = (tenant: string) => forTenant(db, tenant).media.create({ key: `private/${tenant}/${randomUUID()}.mp4`, driver: "local", mime: "video/mp4", size: 100, status: "ready", visibility: "private" });
    const own = await makeVideo(tenantId), foreign = await makeVideo(other);
    const defaults = collectionDefs.story.defaults;
    const input = (id: string) => ({ ...defaults, slug: "self-hosted-story", status: "published" as const, data: { ...defaults.data as object, poster: "/images/poster.jpg", source: { provider: "file", idOrSrc: id } } });
    // The source is the only UUID, so an unrelated poster cannot hide a missing media reference.
    await assert.rejects(saveCollectionItem(db, tenantId, "story", input(foreign.id)), { status: 400 });
    const draft = await saveCollectionItem(db, tenantId, "story", { ...input(own.id), status: "draft" });
    assert.equal(await repo.outbox.count({ where: { topic: "media.publish" } }), 0);
    await saveCollectionItem(db, tenantId, "story", { ...input(own.id), id: draft.id });
    const job = await repo.outbox.first({ where: { topic: "media.publish" } });
    assert.deepEqual(job?.payload, { tenantId, id: own.id });
  } finally {
    await ops.tenant.deleteMany({ where: { id: { in: [tenantId, other] } } });
    await Promise.all([db.$disconnect(), ops.$disconnect()]);
  }
});

test("promote stores variants; promote rejects foreign variant keys", { skip: !process.env.DATABASE_URL }, async () => {
  const db = createDb({ pool: 2 }), ops = createPlatformDb({ pool: 1 }), tenantId = randomUUID();
  try {
    await ops.tenant.create({ data: { id: tenantId, slug: tenantId, name: "[DỮ LIỆU MẪU]", planId: "basic", status: "active" } });
    const row = await reserveUpload(db, tenantId, { mime: "image/png", size: 100 }, "local");
    const key = `private/${tenantId}/2026/10/${row.id}.png`;
    const variant = { key: key.replace(/\.png$/, "-w640.avif"), format: "avif" as const, width: 640, height: 480, size: 60 };
    for (const invalid of [`private/${randomUUID()}/x.avif`, `tenants/${tenantId}/x.avif`, `private/${tenantId}/../other/x.avif`]) {
      await assert.rejects(promoteMedia(db, tenantId, row.id, { key, mime: "image/png", size: 80, variants: [{ ...variant, key: invalid }] }), MediaError);
      assert.equal((await forTenant(db, tenantId).media.get(row.id))?.status, "quarantine");
    }
    assert.equal(await promoteMedia(db, tenantId, row.id, { key, mime: "image/png", size: 80, variants: [variant] }), true);
    assert.deepEqual((await forTenant(db, tenantId).media.get(row.id))?.variants, [variant]);
    assert.equal(await mediaUsage(forTenant(db, tenantId)), 80, "variants do not consume upload quota");
  } finally {
    await ops.tenant.deleteMany({ where: { id: tenantId } });
    await Promise.all([db.$disconnect(), ops.$disconnect()]);
  }
});

test("media: concurrent reserve, release, expireStale, B cannot read A, publish enqueues", { skip: !process.env.DATABASE_URL, timeout: 60_000 }, async () => {
  const db = createDb({ pool: 10 }), ops = createPlatformDb({ pool: 2 });
  const tenantId = randomUUID(), other = randomUUID(), MB = 1024 ** 2;
  try {
    for (const id of [tenantId, other]) await ops.tenant.create({ data: { id, slug: id, name: "[DỮ LIỆU MẪU]", planId: "basic", status: "active" } });
    await ops.plan.create({ data: { id: tenantId, name: "[DỮ LIỆU MẪU]", features: [], limits: {} } });
    const repo = forTenant(db, tenantId);
    await repo.media.create({ key: `private/${tenantId}/used`, driver: "local", mime: "video/mp4", size: 900 * MB, status: "ready", visibility: "private" });
    const results = await Promise.allSettled(Array.from({ length: 10 }, () => reserveUpload(db, tenantId, { mime: "image/jpeg", size: 15 * MB }, "local")));
    assert.equal(results.filter(r => r.status === "fulfilled").length, 8, results.map(r => r.status === "rejected" ? String(r.reason) : "ok").join("; ")); // 1 GiB = 1024 MiB: (1024 - 900) / 15.
    assert.ok(results.filter(r => r.status === "rejected").every(r => r.status === "rejected" && r.reason instanceof MediaQuotaError));
    assert.ok(await mediaUsage(repo) <= 1024 * MB);
    const rows = await repo.media.list({ where: { status: "quarantine" } });
    assert.equal(await forTenant(db, other).media.get(rows[0].id), null);
    assert.equal(rows[0].visibility, "private");
    await cancelUpload(db, tenantId, rows[0].id);
    await rejectMedia(db, tenantId, rows[1].id, "invalid bytes");
    assert.equal(await repo.auditLog.count({ where: { action: "media.rejected" } }), 1);
    await repo.media.update(rows[2].id, { createdAt: new Date(Date.now() - 25 * 3600_000) });
    await repo.media.update(rows[3].id, { createdAt: new Date(Date.now() - 23 * 3600_000) });
    const expired = await expireStaleMedia(ops);
    assert.ok(expired.some(row => row.id === rows[2].id));
    assert.ok(!expired.some(row => row.id === rows[3].id));
    assert.equal(await mediaUsage(repo), (900 + 5 * 15) * MB);
    await completeUpload(db, tenantId, rows[3].id);
    await completeUpload(db, tenantId, rows[3].id);
    assert.equal(await repo.outbox.count({ where: { topic: "media.scan" } }), 1);
    const privateKey = `private/${tenantId}/2026/10/ready.jpg`;
    assert.equal(await promoteMedia(db, tenantId, rows[3].id, { key: privateKey, mime: "image/jpeg", size: 10 }), true);
    assert.equal(await promoteMedia(db, tenantId, rows[3].id, { key: privateKey, mime: "image/jpeg", size: 10 }), false);
    await publishMedia(repo, [rows[3].id]);
    await publishMedia(repo, [rows[3].id]);
    assert.equal(await repo.outbox.count({ where: { topic: "media.publish" } }), 1);
    assert.ok(forPlatform(ops).media);
    await ops.tenant.update({ where: { id: other }, data: { planId: tenantId } });
    await assert.rejects(reserveUpload(db, other, { mime: "image/png", size: 1 }, "local"), MediaQuotaError);
    await ops.tenant.update({ where: { id: tenantId }, data: { limitOverrides: { mediaGb: { add: 1, reason: "test" } } } });
    await reserveUpload(db, tenantId, { mime: "video/mp4", size: 200 * MB }, "local");
    for (const row of await repo.media.list()) await repo.media.delete(row.id);
    await ops.tenant.update({ where: { id: tenantId }, data: { limitOverrides: { mediaGb: { add: 0, reason: "test" } } } });
    await repo.media.create({ key: `private/${tenantId}/used930`, driver: "local", mime: "video/mp4", size: 930 * MB, status: "ready", visibility: "private" });
    const six = await Promise.allSettled(Array.from({ length: 10 }, () => reserveUpload(db, tenantId, { mime: "image/jpeg", size: 15 * MB }, "local")));
    assert.equal(six.filter(r => r.status === "fulfilled").length, 6);
    assert.equal(await mediaUsage(repo), 1020 * MB);
  } finally {
    await ops.tenant.deleteMany({ where: { id: { in: [tenantId, other] } } });
    await ops.plan.deleteMany({ where: { id: tenantId } });
    await Promise.all([db.$disconnect(), ops.$disconnect()]);
  }
});

test("media: page and collection publication enqueue only ready private refs, drafts stay private", { skip: !process.env.DATABASE_URL }, async () => {
  const db = createDb({ pool: 3 }), ops = createPlatformDb({ pool: 1 }), tenantId = randomUUID();
  try {
    await ops.tenant.create({ data: { id: tenantId, slug: tenantId, name: "[DỮ LIỆU MẪU]", planId: "premium", status: "active" } });
    const repo = forTenant(db, tenantId), site = await repo.site.create({ name: "[DỮ LIỆU MẪU]", themeId: "t15" });
    const user = await repo.siteUser.create({ name: "[DỮ LIỆU MẪU]", role: "owner", email: "media@test.vn" });
    const media = await repo.media.create({ key: `private/${tenantId}/a.jpg`, driver: "local", status: "ready", visibility: "private", mime: "image/jpeg", size: 10 });
    const page = await repo.page.create({ siteId: site.id, slug: "", kind: "home", sections: [] });
    await repo.page.create({ siteId: site.id, slug: "lien-he", sections: [] });
    const data = { ...sectionRegistry.types.hero.defaults, image: { id: media.id, alt: { vi: "[DỮ LIỆU MẪU]" } } };
    const actor = { siteUserId: user.id };
    await saveDraft(db, tenantId, { pageId: page.id, expectedRevision: 0, actor, draftSections: [{ id: "hero", type: "hero", variant: "t15", enabled: true }], sections: [{ sectionId: "hero", type: "hero", draftData: data }] });
    assert.equal(await repo.outbox.count({ where: { topic: "media.publish" } }), 0);
    await publishPage(db, tenantId, { pageId: page.id, expectedRevision: 1, actor });
    assert.equal(await repo.outbox.count({ where: { topic: "media.publish" } }), 1);
    const productMedia = await repo.media.create({ key: `private/${tenantId}/p.jpg`, driver: "local", status: "ready", visibility: "private", mime: "image/jpeg", size: 10 });
    const defaults = collectionDefs.product.defaults;
    const product = await saveCollectionItem(db, tenantId, "product", { ...defaults, slug: "media-product", status: "draft", data: { ...defaults.data as object, images: [productMedia.id] } });
    assert.equal(await repo.outbox.count({ where: { topic: "media.publish" } }), 1);
    await saveCollectionItem(db, tenantId, "product", { ...defaults, ...product, status: "published", data: { ...defaults.data as object, images: [productMedia.id] } });
    assert.equal(await repo.outbox.count({ where: { topic: "media.publish" } }), 2);
  } finally { await ops.tenant.deleteMany({ where: { id: tenantId } }); await Promise.all([db.$disconnect(), ops.$disconnect()]); }
});

test("media: lifecycle releases reservations, isolates B, audits expiry and promotes once", { skip: !process.env.DATABASE_URL }, async () => {
  const db = createDb({ pool: 2 }), ops = createPlatformDb({ pool: 1 }), tenantId = randomUUID(), other = randomUUID();
  try {
    for (const id of [tenantId, other]) await ops.tenant.create({ data: { id, slug: id, name: "[DỮ LIỆU MẪU]", planId: "basic", status: "active" } });
    const repo = forTenant(db, tenantId);
    const make = (hours = 0) => repo.media.create({ key: `quarantine/${tenantId}/${randomUUID()}`, driver: "local", mime: "image/png", size: 100, status: "quarantine", visibility: "private", createdAt: new Date(Date.now() - hours * 3600_000) });
    const [cancelled, rejected, stale, recent] = await Promise.all([make(), make(), make(25), make(23)]);
    assert.equal(await mediaUsage(repo), 400);
    assert.equal(await forTenant(db, other).media.get(recent.id), null);
    await assert.rejects(cancelUpload(db, other, recent.id), { status: 404 });
    await cancelUpload(db, tenantId, cancelled.id);
    await rejectMedia(db, tenantId, rejected.id, "invalid bytes");
    await rejectMedia(db, tenantId, rejected.id, "retry");
    const expired = await forPlatform(ops).media.expireStale();
    assert.ok(expired.some(row => row.id === stale.id)); assert.ok(!expired.some(row => row.id === recent.id));
    assert.equal(await mediaUsage(repo), 100);
    assert.equal(await repo.auditLog.count({ where: { action: "media.rejected" } }), 2);
    await completeUpload(db, tenantId, recent.id); await completeUpload(db, tenantId, recent.id);
    assert.equal(await repo.outbox.count({ where: { topic: "media.scan" } }), 1);
    const data = { key: `private/${tenantId}/2026/10/a.png`, mime: "image/png", size: 60 };
    assert.equal(await promoteMedia(db, tenantId, recent.id, data), true);
    assert.equal(await promoteMedia(db, tenantId, recent.id, data), false);
    assert.equal(await mediaUsage(repo), 60);
    assert.equal((await repo.media.get(recent.id))?.visibility, "private");
    assert.equal(await forTenant(db, other).media.get(recent.id), null);
    await assert.rejects(cancelUpload(db, tenantId, recent.id), { status: 404 });
    await publishMedia(repo, [recent.id]); await publishMedia(repo, [recent.id]);
    assert.equal(await repo.outbox.count({ where: { topic: "media.publish" } }), 1);
  } finally { await ops.tenant.deleteMany({ where: { id: { in: [tenantId, other] } } }); await Promise.all([db.$disconnect(), ops.$disconnect()]); }
});

test("I1: actual size may exceed reservation only within kind limit and locked tenant quota", { skip: !process.env.DATABASE_URL }, async () => {
  const db = createDb({ pool: 4 }), ops = createPlatformDb({ pool: 1 }), tenantId = randomUUID(), GB = 1024 ** 3;
  try {
    await ops.tenant.create({ data: { id: tenantId, slug: tenantId, name: "[DỮ LIỆU MẪU]", planId: "basic", status: "active" } });
    const repo = forTenant(db, tenantId);
    const first = await reserveUpload(db, tenantId, { mime: "image/png", size: 10 }, "local");
    const data = (id: string, size: number) => ({ key: `private/${tenantId}/${id}.png`, mime: "image/png", size });
    assert.equal(await promoteMedia(db, tenantId, first.id, data(first.id, 20)), true);
    assert.equal((await repo.media.get(first.id))?.size, 20);
    await repo.media.create({ key: `private/${tenantId}/used`, driver: "local", mime: "video/mp4", size: GB - 50, status: "ready", visibility: "private" });
    const rows = await Promise.all([reserveUpload(db, tenantId, { mime: "image/png", size: 10 }, "local"), reserveUpload(db, tenantId, { mime: "image/png", size: 10 }, "local")]);
    const results = await Promise.allSettled(rows.map(row => promoteMedia(db, tenantId, row.id, data(row.id, 20))));
    assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
    assert.ok(results.some(result => result.status === "rejected" && result.reason instanceof MediaQuotaError));
    assert.equal(await mediaUsage(repo), GB);
    const remaining = (await repo.media.list({ where: { status: "quarantine" } }))[0];
    await assert.rejects(promoteMedia(db, tenantId, remaining.id, data(remaining.id, 15 * 1024 ** 2 + 1)), { status: 400 });
  } finally { await ops.tenant.deleteMany({ where: { id: tenantId } }); await Promise.all([db.$disconnect(), ops.$disconnect()]); }
});
