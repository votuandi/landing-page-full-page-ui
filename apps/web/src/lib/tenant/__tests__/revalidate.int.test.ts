import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { createDb, createPlatformDb, forPlatform, forTenant, withTenantTransaction, enqueueInvalidate, type TenantRepo } from "@solar/db";
import { createMemoryCache, pageTag } from "@solar/cache";
import { sectionRegistry } from "@solar/sections";
import { createSiteData } from "../siteData";
import Redis from "ioredis";
import { createRevalidateHandler, redisNonces } from "../revalidate";
import { createRateLimiter } from "../rateLimit";
import { createInvalidate } from "../../../../../worker/src/handlers/invalidate.ts";
import { runOnce } from "../../../../../worker/src/loop.ts";

const skip = !(process.env.DATABASE_URL && process.env.PLATFORM_DATABASE_URL) && "DATABASE_URL/PLATFORM_DATABASE_URL missing: requires seeded PostgreSQL 16";
test("Postgres: atomic publish → durable retry → signed revalidation → fresh hero, contact and tenant B stay cached", { skip }, async t => {
  const db = createDb({ pool: 2 }), platform = createPlatformDb({ pool: 2 });
  const created: string[] = [];
  const memory = createMemoryCache();
  t.mock.method(console, "error", () => {});
  try {
    // Isolated fixtures use seeded themes, never mutate demo pages used by other integration files.
    const fixtures = [];
    for (const name of ["t15", "t12"]) {
      const seed = await forPlatform(db).domains.resolve(`${name}.localhost`); assert.ok(seed);
      const original = await forTenant(db, seed.tenantId).site.get(seed.siteId); assert.ok(original);
      const tenantId = randomUUID();
      await platform.tenant.create({ data: { id: tenantId, slug: `cache-${tenantId}`, name: "[DỮ LIỆU MẪU] Cache", planId: "premium", status: "active" } });
      created.push(tenantId);
      const repo = forTenant(db, tenantId);
      const site = await repo.site.create({ name: "[DỮ LIỆU MẪU] Cache", themeId: original.themeId });
      const sectionId = randomUUID(), hero = sectionRegistry.types.hero;
      const content = { ...hero.defaults, title: { ...hero.defaults.title, lead: { vi: name } } };
      const home = await repo.page.create({ siteId: site.id, slug: "", publishedAt: new Date(), sections: [{ id: sectionId, type: "hero", variant: name, enabled: true }] });
      await repo.page.create({ siteId: site.id, slug: "lien-he", title: { vi: "Liên hệ" }, publishedAt: new Date(), sections: [] });
      const row = await repo.sectionContent.create({ siteId: site.id, pageId: home.id, sectionId, type: "hero", data: content });
      fixtures.push({ tenantId, siteId: site.id, repo, row, content });
    }
    const [a, b] = fixtures;
    const reads = new Map<string, number>();
    const data = createSiteData(tenantId => {
      const repo = forTenant(db, tenantId);
      return { ...repo, page: { ...repo.page, first: async args => {
        const key = `${tenantId}:${args?.where?.slug}`;
        reads.set(key, (reads.get(key) ?? 0) + 1); return repo.page.first(args);
      } } } as TenantRepo;
    }, undefined, memory);
    const home = (f: typeof a) => data.loadPublishedPage(f.tenantId, f.siteId, "");
    for (const fixture of [a, b, a, b]) assert.equal(sectionRegistry.types.hero.schema.parse((await home(fixture))?.config.sections[0].data).title.lead.vi, fixture === a ? "t15" : "t12");
    await data.loadPublishedPage(a.tenantId, a.siteId, "lien-he");
    assert.equal(reads.get(`${b.tenantId}:`), 1);
    const updated = { ...a.content, title: { ...a.content.title, lead: { vi: "[DỮ LIỆU MẪU] Đã xuất bản" } } };
    // A failed publication rolls back both content and outbox.
    const beforeJobs = await a.repo.outbox.count();
    await assert.rejects(withTenantTransaction(db, a.tenantId, async repo => {
      await repo.sectionContent.update(a.row.id, { data: updated });
      await enqueueInvalidate(repo, [pageTag(a.tenantId, "")]); throw Error("rollback");
    }), /rollback/);
    assert.deepEqual((await a.repo.sectionContent.get(a.row.id))?.data, a.row.data);
    assert.equal(await a.repo.outbox.count(), beforeJobs);
    const started = Date.now();
    const queued = await withTenantTransaction(db, a.tenantId, async repo => {
      await repo.sectionContent.update(a.row.id, { data: updated });
      return enqueueInvalidate(repo, [pageTag(a.tenantId, "")]);
    });
    assert.equal(sectionRegistry.types.hero.schema.parse((await home(a))?.config.sections[0].data).title.lead.vi, "t15");
    const nextTags: string[] = [];
    const post = createRevalidateHandler({ secret: () => "test-secret", invalidate: memory.invalidate, revalidateTag: tag => { nextTags.push(tag); }, limit: createRateLimiter() });
    let offline = true;
    const handle = createInvalidate({ urls: () => "http://web/api/revalidate", secret: () => "test-secret", fetch: async (url, init) => {
      if (offline) throw Error("ECONNREFUSED");
      return post(new Request(url, init));
    } });
    const outbox = forPlatform(platform).outbox;
    let clock = new Date();
    const poll = () => runOnce({ outbox, topics: { invalidate: { handle, maxAgeMs: Infinity } }, tenantId: a.tenantId, now: () => clock });
    for (let i = 0; i < 2; i++) {
      await poll(); const pending = await a.repo.outbox.get(queued.id);
      assert.equal(pending?.status, "pending"); assert.ok(pending.runAt > clock); clock = pending.runAt;
    }
    offline = false; await poll();
    assert.equal((await a.repo.outbox.get(queued.id))?.status, "done");
    assert.deepEqual(nextTags, [pageTag(a.tenantId, "")]);
    assert.equal(sectionRegistry.types.hero.schema.parse((await home(a))?.config.sections[0].data).title.lead.vi, updated.title.lead.vi);
    assert.ok(Date.now() - started < 60_000);
    await home(b); await data.loadPublishedPage(a.tenantId, a.siteId, "lien-he");
    assert.equal(reads.get(`${a.tenantId}:`), 2);
    assert.equal(reads.get(`${a.tenantId}:lien-he`), 1);
    assert.equal(reads.get(`${b.tenantId}:`), 1);
  } finally {
    for (const id of created.reverse()) await platform.tenant.delete({ where: { id } });
    await Promise.all([db.$disconnect(), platform.$disconnect()]);
  }
});

test("Redis: concurrent web replicas accept a nonce once with a ten-minute TTL", {
  skip: !process.env.REDIS_URL && "REDIS_URL missing: requires Redis",
}, async () => {
  const first = new Redis(process.env.REDIS_URL!), second = new Redis(process.env.REDIS_URL!);
  const nonce = randomUUID(), key = `revalidate:nonce:${nonce}`;
  try {
    assert.deepEqual((await Promise.all([redisNonces(first)(nonce), redisNonces(second)(nonce)])).sort(), [false, true]);
    assert.equal(await redisNonces(second)(nonce), false);
    const ttl = await first.pttl(key); assert.ok(ttl > 590_000 && ttl <= 600_000);
  } finally {
    await first.del(key); await Promise.all([first.quit(), second.quit()]);
  }
});
