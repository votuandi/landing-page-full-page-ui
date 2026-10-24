import { randomUUID } from "node:crypto";
import { createPlatformDb, forTenant, forPlatform, withTenantTransaction, enqueueInvalidate } from "@solar/db";
import { hashPassword, totp, createRealm } from "@solar/auth";
import { siteStore } from "@solar/auth/db";
import { sectionRegistry } from "@solar/sections";

const platformDomain = process.env.ADMIN_E2E_PLATFORM_DOMAIN ?? "solar.localhost";
const fixtures = [
  { id: "e7000000-0000-4000-8000-000000000001", slug: "admin-e7-a", status: "active" as const },
  { id: "e7000000-0000-4000-8000-000000000002", slug: "admin-e7-b", status: "active" as const },
  { id: "e7000000-0000-4000-8000-000000000003", slug: "nang-luong-solar", status: "active" as const },
  { id: "e7000000-0000-4000-8000-000000000004", slug: "admin-e7-paused", status: "suspended" as const },
  { id: "e7060000-0000-4000-8000-000000000001", slug: "admin-e7-collections-basic", status: "active" as const },
  { id: "e8030000-0000-4000-8000-000000000001", slug: "admin-e8-media-denied", status: "active" as const, permissionPolicy: { deny: ["media.view"] } },
];
async function main() {
  const db = createPlatformDb({ pool: 2 });
  const password = process.env.SEED_PASSWORD;
  if (!password) throw new Error("SEED_PASSWORD is required");
  const action = process.argv[2], tenantId = fixtures[0].id;
  try {
    if (action === "setup" || action === "cleanup") {
      await db.tenant.deleteMany({ where: { id: { in: fixtures.map(f => f.id) } } });
      if (action === "setup") {
        const hashes = await Promise.all(["t15", "t12"].map(s => hashPassword(`${password}-${s}`)));
        for (const [index, fixture] of fixtures.entries()) {
          await db.tenant.create({ data: { ...fixture, name: "[DỮ LIỆU MẪU] Admin E2E", planId: fixture.slug === "admin-e7-collections-basic" ? "basic" : "premium" } });
          await withTenantTransaction(db, fixture.id, async repo => {
            const site = await repo.site.create({ name: "[DỮ LIỆU MẪU] Admin E2E", themeId: "t15", profile: { name: "[DỮ LIỆU MẪU] Admin E2E", brand: { legalName: "[DỮ LIỆU MẪU] Pháp lý" } } });
            await repo.domain.create({ siteId: site.id, hostname: `${fixture.slug}.${platformDomain}`, status: "active", isPrimary: true, verificationToken: randomUUID() });
            await repo.page.create({ siteId: site.id, slug: "lien-he", title: { vi: "Liên hệ" }, sections: [] });
            const home = await repo.page.create({ siteId: site.id, slug: "", kind: "home", title: { vi: "Trang chủ" }, publishedAt: new Date(),
              sections: [{ id: "hero", type: "hero", variant: "t12", enabled: true }] });
            await repo.sectionContent.create({ siteId: site.id, pageId: home.id, sectionId: "hero", type: "hero", data: sectionRegistry.types.hero.defaults });
            await repo.siteUser.create({ email: "owner@demo.vn", phone: "0901234567", name: "[DỮ LIỆU MẪU] Owner", role: "owner", status: "active", emailVerifiedAt: new Date(), passwordHash: hashes[index === 1 ? 1 : 0] });
            if (index === 0) {
              for (const [source, hours] of [["lead-form", 0], ['"☀"'.repeat(80), 1], ["calculator", 25]] as const) {
                await repo.lead.create({ siteId: site.id, source, phone: "0900000000", name: "[DỮ LIỆU MẪU]", data: {}, createdAt: new Date(Date.now() - hours * 3_600_000) });
              }
              await repo.auditLog.create({ action: "ghost.start", entity: "Site", entityId: site.id });
              await repo.auditLog.create({ action: '"☀"'.repeat(80), entity: "Site", entityId: site.id });
              await repo.page.create({ siteId: site.id, slug: "dashboard-draft", title: { vi: "[DỮ LIỆU MẪU] Bản nháp tổng quan" }, sections: [], draftSections: [] });
            }
            if (index === 0) for (const [username, role] of [["editor_admin", "editor"], ["viewer_admin", "viewer"], ["staff_admin", "staff"], ["customer_client", "client"]] as const) {
              await repo.siteUser.create({ username, name: "[DỮ LIỆU MẪU]", role, status: "active", passwordHash: hashes[0] });
            }
            if (index === 2) for (const [username, expired] of [["nangluongsolar_admin", false], ["expired_admin", true]] as const) {
              await repo.siteUser.create({ username, name: "[DỮ LIỆU MẪU] Bàn giao", role: "owner", status: "active", passwordHash: hashes[0], mustChangePassword: true,
                tempPasswordExpiresAt: new Date(Date.now() + (expired ? -1 : 7 * 86400_000)) });
            }
            // Fixture writes use the same durable invalidation contract as application writes.
            await enqueueInvalidate(repo, [`tenant:${fixture.id}`], [`${fixture.slug}.admin.${platformDomain}`]);
          });
        }
      } else {
        // Survives deletion of the tenant, so running subscribers can evict old entries.
        await forPlatform(db).outbox.enqueue(fixtures.map(f => ({ topic: "invalidate", idempotencyKey: `admin-fixture:${randomUUID()}`,
          payload: { tags: [`tenant:${f.id}`], hosts: [`${f.slug}.admin.${platformDomain}`] } })));
      }
    } else if (action === "media-scan") {
      const { createMediaRuntime } = await import("../../worker/src/mediaRuntime.ts");
      const id = process.argv[3], repo = forTenant(db, tenantId);
      const job = await repo.outbox.first({ where: { topic: "media.scan", idempotencyKey: `media.scan:${id}` } });
      if (!job) throw new Error("Media scan job missing");
      await createMediaRuntime(db).scan(job);
      const row = await repo.media.get(id);
      if (!row) throw new Error("Media fixture missing");
      process.stdout.write(row.status);
    } else if (action === "media-use") {
      const id = process.argv[3];
      const project = await withTenantTransaction(db, tenantId, async repo => {
        const site = await repo.site.first();
        if (!site || !await repo.media.get(id)) throw new Error("Media/site fixture missing");
        await repo.site.update(site.id, { profile: { ...site.profile as object, brand: { ...(site.profile as { brand?: object }).brand, favicon: id } } });
        return repo.project.create({ slug: `media-${randomUUID()}`, title: { vi: "[DỮ LIỆU MẪU] Dự án media" }, coverMediaId: id });
      });
      process.stdout.write(project.id);
    } else if (action === "company-query") {
      const repo = forTenant(db, tenantId), site = await repo.site.first();
      if (!site) throw new Error("Site fixture missing");
      await repo.site.update(site.id, { profile: { ...site.profile as object, megaMenu: { equipment: { enabled: true, groups: [
        { id: "panel", label: "[DỮ LIỆU MẪU] Tấm pin", category: "panel", filters: [{ label: "[DỮ LIỆU MẪU] Công suất", query: { minPower: "0.6" } }] },
      ] } } } });
    } else if (action === "settings-snapshot") {
      const repo = forTenant(db, tenantId);
      process.stdout.write(JSON.stringify({ pages: await repo.page.list({ orderBy: { id: "asc" } }), contents: await repo.sectionContent.list({ orderBy: { id: "asc" } }) }));
    } else if (action === "site-theme") {
      const site = await forTenant(db, tenantId).site.first();
      if (!site) throw new Error("Site fixture missing");
      process.stdout.write(site.themeId);
    } else if (action === "home-page") {
      const page = await forTenant(db, tenantId).page.first({ where: { slug: "", kind: "home" } });
      if (!page) throw new Error("Home page fixture missing");
      process.stdout.write(page.id);
    } else if (action === "totp") {
      const owner = await forTenant(db, tenantId).siteUser.first({ where: { email: "owner@demo.vn" }, omit: { totpSecret: false } });
      if (!owner?.totpSecret) throw new Error("Owner has no TOTP secret");
      process.stdout.write(totp(owner.totpSecret));
    } else if (action === "mail") {
      const purpose = process.argv[3];
      const job = await forTenant(db, tenantId).outbox.first({ where: { topic: "mail.send", payload: { path: ["template"], equals: purpose } }, orderBy: { createdAt: "desc" } });
      if (!job) throw new Error("No auth email queued");
      process.stdout.write((job.payload as { url: string }).url);
    } else if (action === "storefront") {
      // Runtime sessions must be created with app_runtime, never app_platform credentials.
      const { createDb } = await import("@solar/db");
      const runtime = createDb({ pool: 1 });
      try {
        const realm = createRealm({ name: "site", secret: process.env.ADMIN_SESSION_SECRET!, secure: false, sessionTtl: 3600_000, idleTtl: 3600_000, store: siteStore(runtime, { audience: "storefront" }) });
        const logged = await realm.login({ identifier: "customer_client", password: `${password}-t15`, tenantId, ip: "e2e", userAgent: "Playwright" });
        if (!logged.ok) throw new Error("Storefront fixture login failed");
        process.stdout.write(logged.cookie.value);
      } finally { await runtime.$disconnect(); }
    } else if (action === "invite") {
      const { createDb } = await import("@solar/db");
      const { createLoginLimiter } = await import("@solar/auth");
      const { createAccounts } = await import("../src/lib/accounts.ts");
      const runtime = createDb({ pool: 1 });
      try {
        const limiter = createLoginLimiter();
        const realm = createRealm({ name: "site", secret: process.env.ADMIN_SESSION_SECRET!, secure: false, sessionTtl: 3600_000, idleTtl: 3600_000, store: siteStore(runtime, { audience: "admin" }), limiter });
        const owner = await realm.login({ identifier: "owner@demo.vn", password: `${password}-t15`, tenantId, ip: "fixture", userAgent: "Playwright", totp: process.argv[3] });
        if (!owner.ok) throw new Error("Owner fixture login failed");
        const raw = await createAccounts({ db: runtime, realm, limiter }).createSiteInvite(owner.session, tenantId, { email: "staff-e2e@demo.vn", name: "[DỮ LIỆU MẪU] Staff", role: "staff" }, `http://admin-e7-a.admin.${platformDomain}:3300`);
        process.stdout.write(raw);
      } finally { await runtime.$disconnect(); }
    } else throw new Error("Unknown fixture action");
  } finally { await db.$disconnect(); }
}
void main();
