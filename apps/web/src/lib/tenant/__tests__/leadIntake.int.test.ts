import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { createLead, createPlatformDb, forPlatform } from "@solar/db";
import { getWebDb } from "../db";
import { createTenantLeadHandler, MIN_FILL_MS } from "../leadIntake";
import { createRateLimiter } from "../rateLimit";
import { createSiteData, tenantRepository } from "../siteData";

test("Postgres: a lead posted on tenant A's host is stored only in A, with its outbox, before the 200 (E11-S01)", {
  skip: !(process.env.DATABASE_URL && process.env.PLATFORM_DATABASE_URL) && "DATABASE_URL missing: requires seeded PostgreSQL 16",
}, async () => {
  const db = getWebDb(), platform = createPlatformDb({ pool: 1 });
  const data = createSiteData(tenantRepository);
  const [a, b] = await Promise.all(["t15", "t12"].map((id) => forPlatform(db).domains.resolve(`${id}.localhost`)));
  assert.ok(a && b && a.tenantId !== b.tenantId);
  const handler = createTenantLeadHandler({
    loadSite: data.loadTenantSite, saveLead: (tenantId, siteId, lead, options) => createLead(db, tenantId, siteId, lead, options),
    limiter: createRateLimiter(), verifyTurnstile: async () => true,
  });
  const integration = await platform.leadIntegration.create({ data: { tenantId: a.tenantId, kind: "webhook", name: "[DỮ LIỆU MẪU] test", configEncrypted: "test" } });
  const phone = `09${String(Date.now()).slice(-8)}`;
  let id = "";
  try {
    const response = await handler(new Request(`http://${a.hostname}/api/lead`, {
      method: "POST", headers: { "x-tenant-id": a.tenantId, "x-site-id": a.siteId },
      // A forged tenant in the body is ignored.
      body: JSON.stringify({ name: "Khách A", phone, source: "contact", elapsedMs: MIN_FILL_MS, tenantId: b.tenantId,
        zalo: "0901", address: " Q1 ", email: "a@b.vn", message: "Mái tôn", segment: "Hộ gia đình", page: "/lien-he", website: "",
        province: "Đồng Nai", businessType: "Đại lý cấp 1", estimate: { kWp: 6.5, roof: "tôn", storage: true },
        items: [{ sku: "pin-550", name: "Tấm pin 550W", qty: 12 }] }),
    }));
    assert.equal(response.status, 200);
    id = (await response.json()).id;
    const own = await tenantRepository(a.tenantId).lead.list({ where: { phone } });
    assert.deepEqual(own.map((lead) => [lead.id, lead.siteId]), [[id, a.siteId]]);
    // The cleaned t15 payload is what lands in the row.
    assert.deepEqual([own[0].name, own[0].email, own[0].message, own[0].segment, own[0].source], ["Khách A", "a@b.vn", "Mái tôn", "Hộ gia đình", "contact"]);
    const stored = own[0].data as Record<string, unknown>;
    assert.deepEqual([stored.zalo, stored.address, stored.page, typeof stored.submittedAt], ["0901", "Q1", "/lien-he", "string"]);
    assert.deepEqual([stored.province, stored.businessType], ["Đồng Nai", "Đại lý cấp 1"]);
    assert.deepEqual(stored.estimate, { kWp: 6.5, roof: "tôn", storage: true });
    assert.deepEqual(stored.items, [{ sku: "pin-550", name: "Tấm pin 550W", qty: 12 }]);
    assert.equal("tenantId" in stored || "elapsedMs" in stored || "website" in stored, false);
    assert.deepEqual(await tenantRepository(b.tenantId).lead.list({ where: { phone } }), []);
    assert.equal(await tenantRepository(b.tenantId).lead.get(id), null);
    const jobs = await tenantRepository(a.tenantId).outbox.list({ where: { idempotencyKey: `lead.deliver:${id}:${integration.id}` } });
    assert.equal(jobs.length, 1);
    // B's host cannot store a lead under A's site.
    const crossed = await handler(new Request(`http://${b.hostname}/api/lead`, {
      method: "POST", headers: { "x-tenant-id": b.tenantId, "x-site-id": a.siteId },
      body: JSON.stringify({ name: "Khách B", phone, source: "contact", elapsedMs: MIN_FILL_MS }),
    }));
    assert.equal(crossed.status, 404);
  } finally {
    if (id) await platform.outbox.deleteMany({ where: { tenantId: a.tenantId, idempotencyKey: { startsWith: `lead.deliver:${id}:` } } });
    await platform.lead.deleteMany({ where: { phone } });
    await platform.leadIntegration.delete({ where: { id: integration.id } });
    await platform.$disconnect();
  }
});

test("Postgres E11-S02: intake basic giữ lead nhưng không tạo job webhook/Sheets đang enabled", {
  skip: !(process.env.DATABASE_URL && process.env.PLATFORM_DATABASE_URL) && "requires migrated PostgreSQL 16",
}, async () => {
  const db = getWebDb(), platform = createPlatformDb({ pool: 1 }), tenantId = randomUUID(), siteId = randomUUID();
  try {
    await platform.tenant.create({ data: { id: tenantId, slug: tenantId, name: "[DỮ LIỆU MẪU] Lead basic", planId: "basic", status: "active" } });
    await platform.site.create({ data: { id: siteId, tenantId, name: "[DỮ LIỆU MẪU]", themeId: "t15" } });
    // loadTenantSite only serves sites with a verified primary domain.
    await platform.domain.create({ data: { tenantId, siteId, hostname: `basic-${tenantId.slice(0, 8)}.localhost`, isPrimary: true, status: "active", verificationToken: "test" } });
    for (const kind of ["webhook", "google_sheets", "telegram"] as const) await platform.leadIntegration.create({ data: { tenantId, kind, name: kind, configEncrypted: "test" } });
    const handler = createTenantLeadHandler({
      loadSite: createSiteData(tenantRepository).loadTenantSite,
      saveLead: (tid, sid, lead, options) => createLead(db, tid, sid, lead, options),
      limiter: createRateLimiter(), verifyTurnstile: async () => true,
    });
    const response = await handler(new Request("http://basic.localhost/api/lead", { method: "POST", headers: { "x-tenant-id": tenantId, "x-site-id": siteId },
      body: JSON.stringify({ name: "[DỮ LIỆU MẪU]", phone: "0901234598", source: "contact", elapsedMs: MIN_FILL_MS }) }));
    assert.equal(response.status, 200);
    const { id } = await response.json();
    assert.ok(await platform.lead.findUnique({ where: { id } }));
    const jobs = await platform.outbox.findMany({ where: { tenantId, topic: "lead.deliver" } });
    assert.equal(jobs.length, 1); assert.equal((jobs[0].payload as { kind: string }).kind, "telegram");
  } finally {
    await platform.lead.deleteMany({ where: { tenantId } });
    await platform.tenant.deleteMany({ where: { id: tenantId } }); await platform.$disconnect();
  }
});
