import { mkdirSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { createPlatformDb, forTenant, createPreviewToken, saveDraft, publishPage, type Prisma } from "@solar/db";
import { sectionRegistry } from "@solar/sections";

const file = resolve("../../tooling/visual/.test-dist/production-fixture.json");
const domain = process.env.E2E_PLATFORM_DOMAIN ?? "solar.example.com";
const slugs = ["cache-e5-a", "cache-e5-b"];
const json = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value));
const mark = (value: string) => `[DỮ LIỆU MẪU] ${value}`;
type Fixture = { tenantId: string; siteId: string; pageId: string; userId: string; postId: string; host: string };
type Saved = { sites: Fixture[]; disabled: Prisma.JsonValue | null };
async function main() {
  const db = createPlatformDb({ pool: 2 });
  try {
    const action = process.argv[2];
    if (action === "setup") {
      // Only these dedicated fixtures are replaced; demo tenants and the seeded DB stay intact.
      await db.tenant.deleteMany({ where: { slug: { in: slugs } } });
      const disabled = (await db.platformSetting.findUnique({ where: { key: "features.disabled" } }))?.value ?? null;
      const sites: Fixture[] = [];
      for (const [i, slug] of slugs.entries()) {
        const label = i ? "B" : "A";
        const tenant = await db.tenant.create({ data: { slug, name: mark(label), planId: "premium", status: "active" } });
        const repo = forTenant(db, tenant.id);
        const site = await repo.site.create({ name: mark(label), themeId: "t15", locales: ["vi", "en"], pageTypes: ["home", "contact", "policy", "about", "news"],
          profile: { name: { vi: mark(`${label} VI`), en: mark(`${label} EN`) }, description: { vi: `${label} mô tả`, en: `${label} description` } } });
        const host = `${slug}.${domain}`;
        await repo.domain.create({ siteId: site.id, hostname: host, status: "active", isPrimary: true, verificationToken: randomUUID() });
        const user = await repo.siteUser.create({ name: mark("Owner"), role: "owner", email: "owner@example.invalid" });
        const types = ["site-header", "hero", "calculator", "site-footer"] as const;
        const page = await repo.page.create({ siteId: site.id, slug: "", kind: "home", title: { vi: `${label} trang chủ`, en: `${label} home` }, publishedAt: new Date(),
          sections: types.map(type => ({ id: type, type, variant: "t15", enabled: true })) });
        for (const type of types) {
          const def = sectionRegistry.getType(type)!;
          const data = structuredClone(def.defaults) as Record<string, any>;
          if (type === "hero") data.title.lead = { vi: mark(`${label} body 0`), en: mark(`${label} body EN`) };
          if (type === "site-header" || type === "site-footer") data.brand.name = mark(`${label} chrome 0`);
          await repo.sectionContent.create({ siteId: site.id, pageId: page.id, sectionId: type, type, schemaVersion: def.schemaVersion, data: json(data) });
        }
        for (const slug of ["lien-he", "ve-chung-toi"]) await repo.page.create({ siteId: site.id, slug, kind: "system", sections: [], publishedAt: new Date(), title: { vi: `${label} ${slug} VI`, en: `${label} ${slug} EN` } });
        const draftOnly = await repo.page.create({ siteId: site.id, slug: "uu-dai/preview-only", kind: "landing", title: { vi: "Draft title 0" }, sections: [{ id: "hero", type: "hero", variant: "t15", enabled: true }] });
        await repo.sectionContent.create({ siteId: site.id, pageId: draftOnly.id, sectionId: "hero", type: "hero", data: json(sectionRegistry.types.hero.defaults) });
        const post = await repo.post.create({ slug: "shared", status: "published", title: { vi: `${label} post 0`, en: `${label} post EN` }, data: { cover: "/images/illustrations/home-solar.webp", readMinutes: 3, excerpt: { vi: `${label} excerpt 0` }, body: [{ vi: mark(`${label} article 0`) }] } });
        sites.push({ tenantId: tenant.id, siteId: site.id, pageId: page.id, userId: user.id, postId: post.id, host });
      }
      mkdirSync(resolve(file, ".."), { recursive: true });
      writeFileSync(file, JSON.stringify({ sites, disabled }));
      console.log(JSON.stringify(sites));
      return;
    }
    const saved = JSON.parse(readFileSync(file, "utf8")) as Saved;
    const a = saved.sites[0];
    const repo = forTenant(db, a.tenantId);
    if (action === "cleanup") {
      if (saved.disabled === null) await db.platformSetting.deleteMany({ where: { key: "features.disabled" } });
      else await db.platformSetting.upsert({ where: { key: "features.disabled" }, create: { key: "features.disabled", value: json(saved.disabled) }, update: { value: json(saved.disabled) } });
      await db.tenant.deleteMany({ where: { slug: { in: slugs } } });
      unlinkSync(file);
    } else if (action === "publish") {
      const page = (await repo.page.get(a.pageId))!;
      const sections = [];
      for (const type of ["hero", "site-header", "site-footer"]) {
        const row = (await repo.sectionContent.first({ where: { pageId: page.id, type } }))!;
        const data = structuredClone(row.data) as Record<string, any>;
        if (type === "hero") data.title.lead.vi = mark("A body 1"); else data.brand.name = mark("A chrome 1");
        sections.push({ sectionId: row.sectionId, type, draftData: data });
      }
      const draft = await saveDraft(db, a.tenantId, { pageId: page.id, expectedRevision: page.revision, actor: { siteUserId: a.userId }, sections });
      await publishPage(db, a.tenantId, { pageId: page.id, expectedRevision: draft.revision, actor: { siteUserId: a.userId } });
      await repo.page.update(page.id, { title: { vi: "A published title", en: "A home" } });
    } else if (action === "collection") {
      await repo.post.update(a.postId, { title: { vi: "A post 1", en: "A post EN" }, data: { cover: "/images/illustrations/home-solar.webp", readMinutes: 3, excerpt: { vi: "A excerpt 1" }, body: [{ vi: mark("A article 1") }] } });
      await repo.post.create({ slug: "was-missing", title: { vi: "A new post" }, status: "published", data: { cover: "/images/illustrations/home-solar.webp", readMinutes: 3, excerpt: { vi: "A new excerpt" }, body: [{ vi: mark("A newly published") }] } });
    } else if (action === "site") {
      await repo.site.update(a.siteId, { pageTypes: ["home", "contact", "policy", "about"], profile: { name: { vi: mark("A updated VI"), en: mark("A updated EN") }, description: { vi: "A updated description", en: "A updated description EN" } } });
    } else if (action === "restore-news") {
      await repo.site.update(a.siteId, { pageTypes: ["home", "contact", "policy", "about", "news"] });
    } else if (action === "disable") {
      await db.platformSetting.upsert({ where: { key: "features.disabled" }, create: { key: "features.disabled", value: ["calculator"] }, update: { value: ["calculator"] } });
    } else if (action === "token") console.log(await createPreviewToken(db, a.tenantId, a.siteId));
    else if (action.startsWith("draft-")) {
      const version = action.slice(6);
      const draftOnly = (await repo.page.first({ where: { slug: "uu-dai/preview-only" } }))!;
      await repo.page.update(draftOnly.id, { title: { vi: `Draft title ${version}` } });
      const page = (await repo.page.get(a.pageId))!;
      const sections = [];
      for (const type of ["hero", "site-header", "site-footer"]) {
        const row = (await repo.sectionContent.first({ where: { pageId: page.id, type } }))!;
        const data = structuredClone(row.data) as Record<string, any>;
        if (type === "hero") data.title.lead.vi = mark(`A draft body ${version}`); else data.brand.name = mark(`A draft chrome ${version}`);
        sections.push({ sectionId: row.sectionId, type, draftData: data });
      }
      await saveDraft(db, a.tenantId, { pageId: page.id, expectedRevision: page.revision, actor: { siteUserId: a.userId }, sections });
    } else if (action === "second-site") {
      // D17 enforces one site per tenant; prove the DB boundary instead of weakening it for a test.
      try { await repo.site.create({ name: mark("Forbidden second site"), themeId: "t15" }); }
      catch (error) { if ((error as { code?: string }).code === "P2002") { console.log("unique tenant/site enforced"); return; } throw error; }
      throw new Error("Second site unexpectedly accepted");
    } else throw new Error(`Unknown production fixture action: ${action}`);
  } finally { await db.$disconnect(); }
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
