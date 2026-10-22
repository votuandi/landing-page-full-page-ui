import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { effectivePermissions, type Session } from "@solar/auth";
import { createDb, createPlatformDb, forTenant, withTenantTransaction } from "@solar/db";
import { loadDashboard } from "../lib/dashboard.ts";
import { createDashboardDeps } from "../lib/dashboardRuntime.ts";

test("dashboard PostgreSQL", { skip: !process.env.DATABASE_URL || !process.env.PLATFORM_DATABASE_URL ? "requires PostgreSQL" : false }, async t => {
  const db = createDb({ pool: 8 }), ops = createPlatformDb({ pool: 2 });
  const a = randomUUID(), b = randomUUID(), now = new Date("2026-10-22T01:00:00Z");
  const sites = new Map<string, string>();
  const user: Session = { id: "session", accountId: a, tenantId: a, realm: "site", audience: "admin", kind: "user", role: "owner",
    permissions: effectivePermissions({ role: "owner", audience: "admin" }), expiresAt: new Date(now.getTime() + 60_000), mustChangePassword: false };
  try {
    for (const id of [a, b]) {
      await ops.tenant.create({ data: { id, slug: `dashboard-${id}`, name: "[DỮ LIỆU MẪU] Dashboard", planId: "basic", status: "active" } });
      const site = await forTenant(db, id).site.create({ name: "[DỮ LIỆU MẪU]", themeId: "t15" });
      sites.set(id, site.id);
    }
    const siteId = sites.get(a)!;
    const deps = createDashboardDeps(db, { tenantId: a, siteId, slug: `dashboard-${a}` }, "solar.vn");
    await withTenantTransaction(db, a, async repo => {
      for (const [hours, status] of [[25, "new"], [24, "new"], [23, "new"], [25, "contacted"]] as const) {
        await repo.lead.create({ siteId, source: "lead-form", phone: "0900000000", data: {}, status, createdAt: new Date(now.getTime() - hours * 3_600_000) });
      }
      for (const [slug, draftSections, draftData] of [["structure-draft", [], null], ["content-draft", null, { vi: "Nội dung mới" }], ["clean", null, null]] as const) {
        const page = await repo.page.create({ siteId, slug, title: { vi: slug }, sections: [], ...(draftSections ? { draftSections: [...draftSections] } : {}) });
        await repo.sectionContent.create({ siteId, pageId: page.id, sectionId: "hero", type: "hero", data: { title: { vi: slug === "clean" ? "Hoàn chỉnh" : "[DỮ LIỆU MẪU]" } }, ...(draftData ? { draftData } : {}) });
      }
      for (const [status, size] of [["ready", 512 * 1024 ** 2], ["failed", 300], ["quarantine", 100]] as const) {
        await repo.media.create({ key: `tenants/${a}/${randomUUID()}`, driver: "local", mime: "image/png", size, status });
      }
      for (let i = 0; i < 12; i++) await repo.auditLog.create({ action: "ghost.start", entity: "Site", createdAt: new Date(now.getTime() - i * 1000) });
    });
    await t.test("stale new leads", async () => {
      const result = await loadDashboard(user, deps, now);
      assert.equal(result.leads?.stale, 1); assert.equal(result.leads?.week, 4);
    });
    await t.test("Vietnam midnight boundaries", async () => {
      for (const createdAt of ["2026-10-21T16:59:59Z", "2026-10-21T17:00:00Z", "2026-10-22T02:00:00Z"]) {
        await forTenant(db, a).lead.create({ siteId, source: "calculator", phone: "0900000000", data: {}, createdAt: new Date(createdAt) });
      }
      const result = await loadDashboard(user, deps, now);
      assert.equal(result.leads?.today, 1); assert.equal(result.leads?.week, 6);
    });
    await t.test("draft pages", async () => {
      const result = await loadDashboard(user, deps, now);
      assert.deepEqual(result.content?.drafts.map(p => p.title).sort(), ["content-draft", "structure-draft"]);
      assert.equal(result.content?.samples.length, 2);
      assert.equal(result.media?.bytes, 512 * 1024 ** 2 + 100);
      assert.equal(result.domain?.hostname, `dashboard-${a}.solar.vn`);
      assert.equal(result.activity?.length, 10);
    });
    await t.test("tenant isolation", async () => {
      const before = await loadDashboard(user, deps, now);
      await withTenantTransaction(db, b, async repo => {
        await repo.lead.create({ siteId: sites.get(b)!, source: "foreign-source", phone: "0900000000", data: {}, createdAt: now });
        await repo.auditLog.create({ action: "foreign-action", entity: "Site", createdAt: now });
        await repo.page.create({ siteId: sites.get(b)!, slug: "foreign", sections: [], draftSections: [] });
        await repo.media.create({ key: `tenants/${b}/${randomUUID()}`, driver: "local", mime: "image/png", size: 999 });
      });
      assert.deepEqual(await loadDashboard(user, deps, now), before);
    });
    await t.test("10k leads under 1s", async () => {
      // Bulk fixture setup uses platform credentials; the timed loader uses the runtime role with RLS.
      await ops.lead.createMany({ data: Array.from({ length: 10_000 }, (_, i) => ({
        tenantId: a, siteId, source: ["lead-form", "calculator", "quote-form"][i % 3], phone: "0900000000", data: {},
        createdAt: new Date(now.getTime() - i % 30 * 86_400_000),
      })) });
      await loadDashboard(user, deps, now);
      const start = performance.now();
      const result = await loadDashboard(user, deps, now);
      const elapsed = performance.now() - start;
      t.diagnostic(`10k leads loadDashboard: ${elapsed.toFixed(1)} ms`);
      assert.ok(result.leads!.week > 2000);
      assert.ok(elapsed < 1000, `loadDashboard took ${elapsed.toFixed(1)} ms`);
    });
  } finally {
    await ops.tenant.deleteMany({ where: { id: { in: [a, b] } } });
    await db.$disconnect(); await ops.$disconnect();
  }
});
