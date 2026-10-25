import assert from "node:assert/strict";
import test from "node:test";
import { runMediaOrphans, createPlatformDb, forPlatform, forTenant, type OrphanOptions } from "@solar/db";
import { randomUUID } from "node:crypto";

test("orphans log list before deleting objects using row driver; dry-run does not delete", async () => {
  for (const dryRun of [false, true]) {
    const events: string[] = [];
    const row = { tenantId: "tenant", id: "id", key: "private/tenant/a", driver: "s3" as const, keys: ["private/tenant/a"], orphanedAt: new Date() };
    await runMediaOrphans({ dryRun, sweep: async options => { events.push(options.dryRun ? "preview" : "commit"); return options.dryRun || options.canDelete?.(row) ? [row] : []; }, log: () => events.push("log"), storage: kind => { assert.equal(kind, "s3"); return { delete: async () => { events.push("delete"); } }; } });
    assert.deepEqual(events, dryRun ? ["preview", "log"] : ["preview", "log", "commit", "delete"]);
  }
});

test("orphan sweep deletes original and variants only through row driver; public invalidates and private does not", { skip: !process.env.DATABASE_URL }, async () => {
  const db = createPlatformDb({ pool: 2 }), tenantId = randomUUID();
  try {
    await db.tenant.create({ data: { id: tenantId, slug: tenantId, name: "[DỮ LIỆU MẪU]", planId: "premium" } });
    const repo = forTenant(db, tenantId), calls: { kind: string; key: string }[] = [];
    for (const visibility of ["private", "public"] as const) {
      const key = `${visibility === "public" ? "tenants" : "private"}/${tenantId}/${randomUUID()}.png`;
      const variants = [640, 1280, 1920].flatMap(width => (["avif", "webp"] as const).map(format => ({ key: key.replace(/\.png$/, `-w${width}.${format}`), width, height: width, size: 1, format })));
      const row = await repo.media.create({ key, variants, visibility, driver: "s3", mime: "image/png", status: "ready", size: 1, orphanedAt: new Date(Date.now() - 31 * 86400_000) });
      const selected: string[] = [];
      await runMediaOrphans({ tenantId, sweep: options => forPlatform(db).media.sweepOrphans(options), log: () => {}, storage: kind => {
        selected.push(kind); return { delete: async key => { calls.push({ kind, key }); } };
      } });
      assert.equal(await repo.media.get(row.id), null);
      assert.ok(selected.length > 0); assert.ok(selected.every(kind => kind === "s3"));
      assert.deepEqual(calls.splice(0), [key, ...variants.map(v => v.key)].map(key => ({ kind: "s3", key })));
      const jobs = await repo.outbox.list({ where: { topic: "invalidate" } });
      if (visibility === "private") assert.equal(jobs.length, 0);
      else { assert.equal(jobs.length, 1); assert.deepEqual((jobs[0].payload as { tags: string[] }).tags, [`tenant:${tenantId}`]); }
    }
  } finally { await db.tenant.deleteMany({ where: { id: tenantId } }); await db.$disconnect(); }
});

test("orphan sweep keeps rows when row driver cannot be resolved and continues other drivers", { skip: !process.env.DATABASE_URL }, async () => {
  const db = createPlatformDb({ pool: 2 }), tenantId = randomUUID();
  try {
    await db.tenant.create({ data: { id: tenantId, slug: tenantId, name: "[DỮ LIỆU MẪU]", planId: "premium" } });
    const repo = forTenant(db, tenantId), rows: { id: string; key: string }[] = [];
    for (const driver of ["s3", "local"] as const) rows.push(await repo.media.create({ key: `private/${tenantId}/${randomUUID()}.png`, driver, mime: "image/png", status: "ready", size: 1, orphanedAt: new Date(Date.now() - 31 * 86400_000) }));
    const logs: string[] = [], deleted: string[] = [];
    await runMediaOrphans({ tenantId, sweep: options => forPlatform(db).media.sweepOrphans(options), log: value => { logs.push(value); }, storage: kind => {
      if (kind === "s3") throw new Error("S3_BUCKET");
      return { delete: async key => { deleted.push(key); } };
    } });
    assert.ok(await repo.media.get(rows[0].id)); assert.equal(await repo.media.get(rows[1].id), null);
    assert.deepEqual(deleted, [rows[1].key]);
    assert.ok(logs.some(line => line.includes(rows[0].id) && line.includes("S3_BUCKET")));
    assert.equal(await repo.auditLog.count({ where: { action: "media.orphan_deleted", entityId: rows[0].id } }), 0);
  } finally { await db.tenant.deleteMany({ where: { id: tenantId } }); await db.$disconnect(); }
});

test("preflight checks the current locked row driver even if it changes after preview", { skip: !process.env.DATABASE_URL }, async () => {
  const db = createPlatformDb({ pool: 2 }), tenantId = randomUUID();
  try {
    await db.tenant.create({ data: { id: tenantId, slug: tenantId, name: "[DỮ LIỆU MẪU]", planId: "premium" } });
    const repo = forTenant(db, tenantId);
    const row = await repo.media.create({ key: `private/${tenantId}/a.png`, driver: "local", mime: "image/png", status: "ready", size: 1, orphanedAt: new Date(Date.now() - 31 * 86400_000) });
    await runMediaOrphans({ tenantId, log: () => {}, sweep: async (options: OrphanOptions) => {
      if (!options.dryRun) await repo.media.update(row.id, { driver: "s3" });
      return forPlatform(db).media.sweepOrphans(options);
    }, storage: kind => { if (kind === "s3") throw new Error("S3_BUCKET"); return { delete: async () => {} }; } });
    assert.ok(await repo.media.get(row.id));
  } finally { await db.tenant.deleteMany({ where: { id: tenantId } }); await db.$disconnect(); }
});
